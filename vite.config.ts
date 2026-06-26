import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.ADMIN_PASSCODE':     JSON.stringify(env.ADMIN_PASSCODE     ?? env.VITE_ADMIN_PASSCODE),
        'process.env.CORS_PROXY_URL':     JSON.stringify(env.CORS_PROXY_URL     ?? env.VITE_CORS_PROXY_URL),
        'process.env.WHATSAPP_NUMBER':    JSON.stringify(env.WHATSAPP_NUMBER    ?? ''),
        // Legacy keys kept for any remaining direct LLM usage
        'process.env.API_KEY':            JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY':     JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GROQ_API_KEY':       JSON.stringify(env.GROQ_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react':    ['react', 'react-dom'],
              'vendor-recharts': ['recharts'],
              'vendor-lucide':   ['lucide-react'],
              'tools-forward':   [
                './components/ForwardCalculator',
                './components/SwapSimulator',
              ],
              'tools-research':  [
                './components/ResearchHub',
                './components/MorningBriefing',
                './services/driftHistory',
              ],
              'tools-lead':      [
                './components/tools/OcComplianceAssessment',
                './components/tools/CorridorCalculator',
              ],
            },
          },
        },
      },
    };
});
