import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Par défaut, on passe par un proxy local (/api/openai) pour éviter CORS + ne pas exposer la clé côté navigateur.
// Si vous voulez forcer l'appel direct, définissez VITE_OPENAI_BASE_URL="https://api.openai.com".
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || '/api/openai';
const SEMANTIC_API_KEY = import.meta.env.VITE_SEMANTIC_API_KEY;

// --------------------------------------------------
// UTILS
// --------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

// Score scientifique : impact pondéré par récence
const computeScientificScore = (citationCount, year) => {
  const impact = Math.log((citationCount || 0) + 1);
  const recency = 1 / (CURRENT_YEAR - year + 1);
  return impact * recency;
};

// --------------------------------------------------
// 1. EXPANSION SÉMANTIQUE (IA)
// --------------------------------------------------

export const expandQueryWithAI = async (query) => {
  // Si on appelle OpenAI directement, il faut une clé. Via proxy, pas besoin côté client.
  if (OPENAI_BASE_URL.startsWith('http') && !OPENAI_API_KEY) return [query];

  const prompt = `
Tu es un moteur de recherche scientifique.
Transforme la requête utilisateur en 5 requêtes académiques pertinentes.
Utilise le vocabulaire scientifique réel (anglais).
Retourne uniquement un JSON:

{
  "queries": ["...", "...", "..."]
}

Requête: "${query}"
`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (OPENAI_BASE_URL.startsWith('http')) headers.Authorization = `Bearer ${OPENAI_API_KEY}`;

    const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI error (status ${response.status})`);
    return JSON.parse(data.choices[0].message.content).queries || [query];
  } catch (err) {
    console.warn("Expansion IA échouée, fallback simple.");
    return [query];
  }
};

// --------------------------------------------------
// 2. RECHERCHE MULTI-STRATÉGIES
// --------------------------------------------------

export const searchResearchTimeline = async (query) => {
  try {
    const headers = {};
    if (SEMANTIC_API_KEY) headers["x-api-key"] = SEMANTIC_API_KEY;

    // 1. Expansion sémantique
    const expandedQueries = await expandQueryWithAI(query);

    let allPapers = [];

    for (const q of expandedQueries) {
      // A. Papiers fondateurs (impact)
      const classicRes = await fetch(
        `/api/scholar?query=${encodeURIComponent(q)}&limit=10&sort=citationCount&fields=title,abstract,tldr,year,authors,url,openAccessPdf,citationCount,paperId`,
        { headers }
      );

      // B. Surveys
      const surveyRes = await fetch(
        `/api/scholar?query=${encodeURIComponent(
          q + " survey review"
        )}&limit=5&sort=relevance&fields=title,abstract,tldr,year,authors,url,openAccessPdf,citationCount,paperId`,
        { headers }
      );

      // C. Récents
      const recentRes = await fetch(
        `/api/scholar?query=${encodeURIComponent(
          q
        )}&limit=10&sort=relevance&year=${CURRENT_YEAR - 3}-${CURRENT_YEAR}&fields=title,abstract,tldr,year,authors,url,openAccessPdf,citationCount,paperId`,
        { headers }
      );

      const classic = await classicRes.json();
      const surveys = await surveyRes.json();
      const recent = await recentRes.json();

      if (classic.data) allPapers.push(...classic.data);
      if (surveys.data) allPapers.push(...surveys.data);
      if (recent.data) allPapers.push(...recent.data);
    }

    // --------------------------------------------------
    // 3. DÉDUPLICATION + NETTOYAGE
    // --------------------------------------------------

    const seen = new Set();
    let results = allPapers
      .filter(
        (p) =>
          p.paperId &&
          !seen.has(p.paperId) &&
          seen.add(p.paperId) &&
          p.title &&
          p.year &&
          p.authors?.length
      )
      .map((paper) => {
        const score = computeScientificScore(
          paper.citationCount || 0,
          paper.year
        );

        return {
          id: paper.paperId,
          title: paper.title,
          year: paper.year,
          description:
            paper.tldr?.text ||
            (paper.abstract ? paper.abstract.slice(0, 200) + "..." : "Résumé non disponible."),
          authors: paper.authors.map((a) => a.name).join(", "),
          pdfUrl: paper.openAccessPdf?.url || paper.url,
          citationCount: paper.citationCount || 0,
          score,
        };
      });

    // --------------------------------------------------
    // 4. FILTRAGE QUALITATIF
    // --------------------------------------------------

    results = results.filter((p) => {
      if (p.year < 1980) return false; // trop archaïque
      if (p.citationCount === 0 && p.year < CURRENT_YEAR - 2) return false;
      return true;
    });

    // --------------------------------------------------
    // 5. TIMELINE CAUSALE
    // --------------------------------------------------

    // On garde les meilleurs scores
    results = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
      .sort((a, b) => a.year - b.year);

    return results;
  } catch (error) {
    console.error("Erreur Recherche:", error);
    return [];
  }
};

// --------------------------------------------------
// 3. ARTICLES SIMILAIRES
// --------------------------------------------------

export const findSimilarArticles = async (title) => {
  return await searchResearchTimeline(title);
};

// --------------------------------------------------
// 4. ANALYSE EXPERTE (IA)
// --------------------------------------------------

export const analyzeArticleWithAI = async (text) => {
  if (OPENAI_BASE_URL.startsWith('http') && !OPENAI_API_KEY) throw new Error("Clé API OpenAI manquante.");

  // On garde une grande partie du texte pour permettre un cours détaillé.
  const truncatedText = text.slice(0, 20000);

  const prompt = `
Tu es un expert scientifique et pédagogue.
Ton analyse doit être fournie au format JSON.

CONTENU DU JSON:
1. "title": Le titre traduit en français.
2. "original_title": Le titre EXACT tel qu'il est écrit dans le papier original (anglais ou autre). NE LE TRADUIS PAS.
3. "authors": Les auteurs principaux (string).
3. "year": L'année de publication (string ou number).
4. "domain": Une catégorie parmi ["Informatique", "Physique", "Biologie", "Médecine", "Mathématiques", "Sciences Sociales", "Économie", "Histoire", "Environnement", "Ingénierie", "Psychologie", "Philosophie"]. Si le domaine exact n'existe pas, choisis le plus proche (ex: Chimie -> Physique ou Biologie).
5. "summary_markdown": TRES IMPORTANT. Ce champ doit contenir TOUT ton résumé détaillé au format MARKDOWN standard.
   - Ne répète PAS le titre de l'article en gras ou en titre.
   - Utilise IMPÉRATIVEMENT des titres Markdowns (## pour les sections principales, ### pour les sous-sections).
   - Tes paragraphes doivent être clairs et concis, pas de blocs de texte indigestes.
   - Saute des lignes entre les paragraphes pour aérer le texte.
   - Utilise SYSTÉMATIQUEMENT du **gras** pour les concepts clés, les mots importants et les noms propres. Cela doit "sauter aux yeux".
   - Fais des listes à puces pour énumérer des points, mais n'en abuse pas.
   - Ton but est que la lecture soit fluide, aérée et hiérarchisée, comme un article de blog technique de haute qualité.

TEXTE DE BASE:
${truncatedText}
`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (OPENAI_BASE_URL.startsWith('http')) headers.Authorization = `Bearer ${OPENAI_API_KEY}`;

    const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Erreur OpenAI (HTTP):", response.status, data);
      const message =
        data?.error?.message ||
        `Appel OpenAI échoué (statut ${response.status}). Vérifiez la clé API ou le modèle.`;
      throw new Error(message);
    }

    if (!data?.choices?.[0]?.message?.content) {
      console.error("Réponse OpenAI inattendue:", data);
      throw new Error("Réponse OpenAI inattendue (aucun contenu retourné).");
    }

    const contentStr = data.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(contentStr);
    } catch (e) {
      console.error("Erreur JSON parse:", e);
      // Fallback si le JSON est malformé mais contient du texte
      parsed = {
        title: "Analyse (Format brut)",
        summary_markdown: contentStr,
        authors: "IA",
        year: new Date().getFullYear(),
        domain: "Science"
      };
    }

    return {
      ...parsed,
      // On mappe le champ markdown vers full_analysis pour le front
      full_analysis: parsed.summary_markdown || parsed.summary || "",
      // IMPORTANT: On peuple aussi 'summary' pour que ce soit sauvegardé en BDD via AppContext
      summary: parsed.summary_markdown || parsed.summary || "",
      explanatory_sections: [] // Toujours vide pour le mode Markdown stream
    };

  } catch (e) {
    console.error("Erreur parsing/fetch IA:", e);
    throw e;
  }

};

// --------------------------------------------------
// 5. CHAT AVEC L'ARTICLE (NOUVEAU)
// --------------------------------------------------

export const chatWithArticleAI = async (question, context, history = []) => {
  // On construit l'historique pour l'IA
  const messages = [
    {
      role: "system",
      content: `Tu es un assistant de recherche intelligent. L'utilisateur te pose des questions sur un article scientifique spécifique.
      
      CONTEXTE DE L'ARTICLE :
      Titre : ${context.title}
      Auteurs : ${context.authors}
      Année : ${context.year}
      Résumé/Extrait : ${context.summary || context.full_text?.slice(0, 5000)}... (tronqué si trop long)

      Consignes :
      1. Réponds UNIQUEMENT en te basant sur le contexte fourni. Si la réponse n'est pas dans le texte, dis-le clairement.
      2. Sois concis, précis et pédagogique.
      3. Cite des passages si pertinent.
      4. Si la question est hors sujet (ex: "Quelle est la capitale de la France ?"), rappelle gentiment que tu es là pour discuter de l'article.`
    },
    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })),
    { role: "user", content: question }
  ];

  try {
    const headers = { "Content-Type": "application/json" };
    if (OPENAI_BASE_URL.startsWith('http') && OPENAI_API_KEY) headers.Authorization = `Bearer ${OPENAI_API_KEY}`;

    const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gpt-4o-mini", // ou gpt-3.5-turbo si 4o non dispo
        messages,
        temperature: 0.5,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Erreur Chat IA");

    return data?.choices?.[0]?.message?.content || "Erreur de réponse.";
  } catch (error) {
    console.error("Erreur Chat:", error);
    throw error;
  }
};
