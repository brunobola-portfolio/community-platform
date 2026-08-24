import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration (Vite 8 / Rolldown)
 *
 * All VITE_ prefixed env variables are automatically exposed to client code.
 * Server config values fall back to defaults if not specified in .env.local.
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Parse server configuration from environment with fallbacks
    const serverPort = parseInt(env.VITE_DEV_PORT || '3000', 10);
    const serverHost = env.VITE_DEV_HOST || '0.0.0.0';

    return {
      server: {
        port: serverPort,
        host: serverHost,
      },
      plugins: [react()],
      build: {
        rolldownOptions: {
          output: {
            // Stable vendor chunks: app code changes every deploy but these
            // rarely do, so returning visitors keep them cached
            codeSplitting: {
              groups: [
                { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
                { name: 'vendor-convex', test: /node_modules[\\/](convex|@convex-dev)[\\/]/ },
                { name: 'vendor-icons', test: /node_modules[\\/]lucide-react[\\/]/ },
              ],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '.'),
        }
      }
    };
});
