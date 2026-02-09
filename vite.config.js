import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 AJOUTEZ CETTE PARTIE "SERVER" 👇
  server: {
    proxy: {
      // Cela crée un tunnel : quand on appelle /api/scholar, 
      // Vite redirige la demande vers Semantic Scholar sans problème de CORS.
      '/api/scholar': {
        target: 'https://api.semanticscholar.org/graph/v1/paper/search',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/scholar/, ''),
      },
    },
  },
})