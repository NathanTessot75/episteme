import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge .env(.local) dans le process Vite (vite.config n'a PAS accès à import.meta.env)
  const env = loadEnv(mode, process.cwd(), '');
  const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || '';

  console.log("OpenAI Key Loaded:", openaiKey ? "YES (Starts with " + openaiKey.substring(0, 3) + ")" : "NO");

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['episteme.maquette.io'],
      proxy: {
        // Cela crée un tunnel : quand on appelle /api/scholar,
        // Vite redirige la demande vers Semantic Scholar sans problème de CORS.
        '/api/scholar': {
          target: 'https://api.semanticscholar.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/scholar/, '/graph/v1/paper/search'),
        },
        // Proxy OpenAI (évite CORS + évite d'exposer la clé côté navigateur)
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (openaiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${openaiKey}`);
              }
            });
          },
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        },
      },
    },
  };
});