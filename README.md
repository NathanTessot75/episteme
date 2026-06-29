# Episteme

**Comprenez la science en un clin d'œil.**

Episteme est une application web qui transforme n'importe quel article scientifique PDF en une explication claire et structurée, générée par IA. Déposez un PDF, et l'application le lit, l'analyse et vous le restitue comme un professeur — avec bibliothèque personnelle, playlists, et espace social.

---

## Fonctionnalités

- **Analyse IA de PDFs** — Déposez un article scientifique, l'IA extrait les concepts clés et génère une explication pédagogique
- **Bibliothèque personnelle** — Retrouvez tous vos articles analysés dans un espace dédié
- **Playlists** — Organisez vos articles en collections thématiques
- **Explorateur** — Découvrez des articles partagés par d'autres utilisateurs
- **Profils & Messages** — Espace social pour suivre d'autres lecteurs et échanger
- **Dark mode** — Interface claire ou sombre selon vos préférences
- **Animations fluides** — Transitions de pages avec Framer Motion

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, Vite |
| Style | Tailwind CSS |
| Animations | Framer Motion |
| Backend / Auth / BDD | Supabase (PostgreSQL, RLS, Auth) |
| Déploiement | Vercel |

---

## Installation

```bash
git clone https://github.com/NathanTessot75/episteme.git
cd episteme
npm install
```

Créez un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev
# → http://localhost:5173
```

---

## Structure

```
src/
├── Pages/          # Home, Library, Explorer, ArticleDetail, Auth, Profile, Messages, PlaylistDetail
├── Components/     # Sidebar, PageTransition, ...
├── Context/        # AppContext (état global, logique IA)
└── api/            # Appels Supabase
```

---

## Licence

© 2026 Nathan Tessot — Tous droits réservés.
