import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION DES CLÉS API ---
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
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
  if (!OPENAI_API_KEY) return [query];

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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
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
        `/api/scholar?query=${encodeURIComponent(q)}&limit=10&sort=citationCount&fields=title,abstract,year,authors,url,openAccessPdf,citationCount,paperId`,
        { headers }
      );

      // B. Surveys
      const surveyRes = await fetch(
        `/api/scholar?query=${encodeURIComponent(
          q + " survey review"
        )}&limit=5&sort=relevance&fields=title,abstract,year,authors,url,openAccessPdf,citationCount,paperId`,
        { headers }
      );

      // C. Récents
      const recentRes = await fetch(
        `/api/scholar?query=${encodeURIComponent(
          q
        )}&limit=10&sort=relevance&year=${CURRENT_YEAR - 3}-${CURRENT_YEAR}&fields=title,abstract,year,authors,url,openAccessPdf,citationCount,paperId`,
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
            paper.abstract ||
            `Article scientifique cité ${paper.citationCount || 0} fois.`,
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
  if (!OPENAI_API_KEY) throw new Error("Clé API OpenAI manquante.");

  const truncatedText = text.slice(0, 25000);

  const prompt = `
Tu es un Professeur d'Université extrêmement pédagogue.
Ta mission n'est PAS de résumer, mais de TRANSFORMER cet article en un COURS MAGISTRAL COMPLET.

OBJECTIF:
Un étudiant qui n'a jamais vu ce sujet doit pouvoir le COMPRENDRE EN PROFONDEUR.

STYLE:
- Très didactique
- Progression logique
- Explications longues et détaillées
- Aucune information implicite

OBLIGATIONS PÉDAGOGIQUES:
Pour chaque concept important:
1. Définition formelle claire
2. Reformulation intuitive
3. Exemple concret
4. Si mathématique: expliquer chaque symbole
5. Si concept abstrait: analogie réelle

FORMAT DE DÉFINITION:
[DEFINITION: Terme :: Explication détaillée]

FORMAT D'EXEMPLE:
[EXEMPLE: Contexte :: Illustration concrète]

LONGUEUR:
- Le cours doit être LONG (minimum 1200 mots)
- Chaque section doit faire au moins 2-3 paragraphes

CATÉGORIE (choisir EXACTEMENT une):
["Informatique","Physique","Biologie","Médecine","Mathématiques","Sciences Sociales","Économie","Histoire","Environnement","Ingénierie","Psychologie","Philosophie","Chimie"]

STRUCTURE JSON STRICTE:
{
  "title": "Titre traduit en français",
  "authors": "Auteurs",
  "year": "Année",
  "domain": "CATÉGORIE",
  "summary": "Introduction pédagogique longue (contexte historique, enjeux, vocabulaire de base).",
  "explanatory_sections": [
    {
      "title": "Fondements théoriques",
      "content": "Cours détaillé avec définitions + exemples"
    },
    {
      "title": "Concepts clés",
      "content": "Décomposition concept par concept"
    },
    {
      "title": "Méthodologie scientifique",
      "content": "Explication des méthodes"
    },
    {
      "title": "Résultats expliqués",
      "content": "Interprétation pédagogique"
    },
    {
      "title": "Discussion et limites",
      "content": "Analyse critique"
    },
    {
      "title": "Conclusion et perspectives",
      "content": "Synthèse + ouverture"
    }
  ]
}

INTERDICTIONS:
- Pas de résumé superficiel
- Pas de phrases vagues
- Pas de jargon non expliqué

TEXTE DE BASE:
${truncatedText}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.25,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);

  } catch (error) {
    console.error("Erreur OpenAI:", error);
    throw new Error("Échec de l'analyse IA.");
  }
};
