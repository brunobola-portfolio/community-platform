import path from 'node:path';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'crypto';

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

/** Escapes a value dropped into an attribute or text node of index.html. */
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Content-Security-Policy for production builds. The theme bootstrap is the
 * only inline script, so it is allowed by hash instead of 'unsafe-inline';
 * dev keeps no meta CSP because Vite and React Refresh inject inline code.
 */
export function buildCsp(html: string, target: 'header' | 'meta' = 'header'): string {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match =>
    `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Browsers ignore frame-ancestors in a meta tag and log a warning; the header keeps it
    ...(target === 'header' ? ["frame-ancestors 'self'"] : []),
  ].join('; ');
}

function siteMeta(env: Record<string, string>): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml: {
      // After Vite's own HTML pass: it re-indents the inline theme script, and a hash taken
      // earlier no longer matches what the browser executes
      order: 'post',
      handler(html, ctx) {
        const filled = html.replace(/%(VITE_[A-Z0-9_]+)%/g, (_match, key: string) =>
          escapeHtml(env[key] ?? process.env[key] ?? META_DEFAULTS[key] ?? ''));
        if (ctx.server) return filled;
        return filled.replace('</title>', `</title>\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp(filled, 'meta')}">`);
      },
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
