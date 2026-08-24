import path from 'node:path';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration (Vite 8 / Rolldown)
 *
 * All VITE_ prefixed env variables are automatically exposed to client code.
 * Two white-label hooks live here:
 *  - siteMeta(): fills %VITE_*% placeholders in index.html (title, OG tags,
 *    canonical) from the env, with generic defaults for a fresh clone
 *  - brandOverlay(): in dev, serves files from the gitignored .brand/public
 *    ahead of public/, so an instance sees its real logo/photos locally
 *    (npm run dist copies the same folder over dist/ for production)
 */
const BRAND_DIR = '.brand/public';

const META_DEFAULTS: Record<string, string> = {
  VITE_SITE_NAME: 'Community Platform',
  VITE_SITE_FULL_NAME: 'Portal comunitário para associações',
  VITE_SITE_URL: 'https://example.org',
  VITE_SITE_DESCRIPTION: 'Portal comunitário com eventos, notícias, área de sócio e assistente IA.',
  VITE_SITE_KEYWORDS: 'associação, comunidade, eventos, cultura, desporto',
  VITE_OG_TAGLINE: 'A casa digital da nossa comunidade.',
};

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf',
};

function siteMeta(env: Record<string, string>): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      return html.replace(/%(VITE_[A-Z0-9_]+)%/g, (_match, key: string) =>
        env[key] ?? process.env[key] ?? META_DEFAULTS[key] ?? '');
    },
  };
}

function brandOverlay(): Plugin {
  return {
    name: 'brand-overlay',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
        const file = path.join(BRAND_DIR, pathname);
        if (!pathname.includes('..') && existsSync(file) && statSync(file).isFile()) {
          res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
          createReadStream(file).pipe(res);
          return;
        }
        next();
      });
    },
  };
}

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
      plugins: [react(), siteMeta(env), brandOverlay()],
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
