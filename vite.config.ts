import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['jad2-logo.svg', 'favicon.ico'],
        manifest: {
          name: 'JAD2FX — Taux de Change MAD',
          short_name: 'JAD2FX',
          description: 'Terminal FX pédagogique du dirham marocain — données BKAM, simulations forward, conformité OC',
          theme_color: '#D4AF37',
          background_color: '#040C1C',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/jad2-logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          ],
        },
        workbox: {
          // Don't precache — we want fresh data on every visit (FX rates, news)
          globPatterns: ['**/*.{js,css,html,svg}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'jad2fx-api',
                networkTimeoutSeconds: 6,
                expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
              handler: 'CacheFirst',
              options: { cacheName: 'jad2fx-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 3600 } },
            },
            {
              urlPattern: /^https:\/\/api\.frankfurter\.app\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'jad2fx-eur-rates', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 } },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.CORS_PROXY_URL':     JSON.stringify(env.CORS_PROXY_URL     ?? env.VITE_CORS_PROXY_URL),
      'process.env.WHATSAPP_NUMBER':    JSON.stringify(env.WHATSAPP_NUMBER    ?? ''),
      'process.env.GEMINI_API_KEY':     JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GROQ_API_KEY':       JSON.stringify(env.GROQ_API_KEY),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
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
