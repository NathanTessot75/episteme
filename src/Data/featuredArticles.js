// src/Data/featuredArticles.js

export const featuredArticles = [
  {
    category: "Intelligence Artificielle",
    articles: [
      {
        id: "feat-ai-1",
        title: "Attention Is All You Need",
        authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "et al."],
        year: "2017",
        domain: "Informatique",
        summary: "C'est l'article fondateur qui a tout changé. Il présente l'architecture 'Transformer', la technologie qui a permis la création de ChatGPT, Claude et Gemini. L'idée clé est le mécanisme d'attention : la machine apprend à se concentrer sur les mots importants d'une phrase, peu importe leur distance.",
        pdfUrl: "https://arxiv.org/pdf/1706.03762.pdf",
        detailed_analysis: {
          explanatory_sections: [
            {
              title: "1. Le Problème des Anciens Modèles",
              content: "Avant 2017, pour traduire une phrase, les IA la lisaient mot à mot (RNN). Problème : arrivé à la fin d'une longue phrase, l'IA oubliait le début. C'était lent et impossible à paralléliser."
            },
            {
              title: "2. La Révolution : L'Attention",
              content: "Les auteurs proposent de jeter les réseaux récurrents. À la place, le modèle regarde TOUS les mots de la phrase en même temps et calcule un score d'importance ('attention') entre chaque paire de mots. Le mot 'Banque' est-il lié à 'Rivière' ou 'Argent' ? Le contexte décide instantanément."
            },
            {
              title: "3. Architecture Transformer",
              content: "Le modèle est composé d'encodeurs (qui lisent) et de décodeurs (qui génèrent). C'est cette architecture qui est aujourd'hui la brique de base de tous les grands modèles de langage (LLM)."
            }
          ]
        }
      }
    ]
  },
  {
    category: "Biologie & Génétique",
    articles: [
      {
        id: "feat-bio-1",
        title: "A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity",
        authors: ["M. Jinek", "E. Charpentier", "J. Doudna", "et al."],
        year: "2012",
        domain: "Biologie",
        summary: "L'article historique qui a révélé CRISPR-Cas9 au monde. Emmanuelle Charpentier et Jennifer Doudna décrivent comment transformer un système immunitaire de bactérie en un 'ciseau génétique' programmable capable de couper et modifier l'ADN à volonté.",
        pdfUrl: "https://www.science.org/doi/pdf/10.1126/science.1225829",
        detailed_analysis: {
          explanatory_sections: [
            {
              title: "1. Le Système Immunitaire Bactérien",
              content: "Les bactéries se défendent contre les virus en gardant des morceaux de leur ADN en mémoire (dans une zone appelée CRISPR). C'est comme un album photo des agresseurs."
            },
            {
              title: "2. Cas9 : Le Ciseau Moléculaire",
              content: "Les chercheuses ont découvert une protéine, Cas9, qui utilise ces 'photos' pour aller couper l'ADN des virus envahisseurs. Si l'ADN correspond à la photo, Cas9 coupe."
            },
            {
              title: "3. La Programmation",
              content: "La percée majeure de cet article est de montrer qu'on peut fabriquer artificiellement ce 'guide'. On peut donc dire à Cas9 d'aller couper n'importe quel gène, chez n'importe quel être vivant. C'est la naissance de l'édition génomique moderne."
            }
          ]
        }
      }
    ]
  },
  {
    category: "Astrophysique",
    articles: [
      {
        id: "feat-space-1",
        title: "First M87 Event Horizon Telescope Results. I. The Shadow of the Supermassive Black Hole",
        authors: ["The EHT Collaboration"],
        year: "2019",
        domain: "Physique",
        summary: "Pour la première fois de l'histoire, l'humanité a vu un trou noir. Cet article présente l'image historique du trou noir supermassif au centre de la galaxie M87, prouvant visuellement l'existence de l'horizon des événements prédit par Einstein.",
        pdfUrl: "https://iopscience.iop.org/article/10.3847/2041-8213/ab0ec7/pdf",
        detailed_analysis: {
          explanatory_sections: [
            {
              title: "1. Un Télescope de la Taille de la Terre",
              content: "Aucun télescope n'était assez puissant seul. Les scientifiques ont synchronisé 8 radiotélescopes répartis sur toute la planète (Hawaï, Chili, Antarctique...) pour créer un télescope virtuel géant grâce à l'interférométrie."
            },
            {
              title: "2. L'Anneau de Feu",
              content: "L'image montre un anneau brillant entourant une zone sombre centrale. La lumière vient du gaz chauffé à des milliards de degrés qui tombe dans le trou noir. La zone sombre centrale est l'ombre du trou noir, d'où la lumière ne peut plus s'échapper."
            },
            {
              title: "3. Confirmation d'Einstein",
              content: "La forme de l'anneau est quasi parfaitement circulaire, exactement comme le prédisait la Relativité Générale d'Einstein dans des conditions de gravité extrême. C'est une confirmation éclatante de la théorie, 100 ans après."
            }
          ]
        }
      }
    ]
  }
];