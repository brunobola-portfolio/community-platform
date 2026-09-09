import path from 'node:path';
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

/**
 * Which platform version an instance runs is otherwise invisible from outside:
 * every deployment is a private repository with its own brand. The version is
 * published two ways from this single source of truth - a `generator` meta tag
 * for whoever opens the page, and /version.json for whoever checks a fleet of
 * them without parsing HTML.
 */
const pkg = JSON.parse(readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf8')) as {
  name: string;
  version: string;
};
const PLATFORM_LABEL = 'Community Platform';

function versionManifest(): Plugin {
  const body = () => JSON.stringify({
    platform: pkg.name,
    version: pkg.version,
    builtAt: new Date().toISOString(),
  }, null, 2) + '\n';

  return {
    name: 'version-manifest',
    // Dev answers the same document as production, so a local check is not a lie
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(body());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: body() });
    },
  };
}

const META_DEFAULTS: Record<string, string> = {
  VITE_SITE_NAME: 'Community Platform',
  VITE_SITE_FULL_NAME: 'Portal comunitário para associações, comunidades e instituições',
  VITE_SITE_URL: 'https://example.org',
  VITE_SITE_DESCRIPTION: 'Portal comunitário com eventos, notícias, área de sócio e assistente IA.',
  VITE_SITE_KEYWORDS: 'associação, comunidade, instituição, eventos, cultura, desporto',
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
export function buildCsp(html: string, target: 'header' | 'meta' = 'header', connectExtra: string[] = []): string {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match =>
    `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
  const connect = ["'self'", 'https://*.convex.cloud', 'wss://*.convex.cloud', ...connectExtra];
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data: blob:",
    `connect-src ${connect.join(' ')}`,
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Browsers ignore frame-ancestors in a meta tag and log a warning; the header keeps it
    ...(target === 'header' ? ["frame-ancestors 'self'"] : []),
  ].join('; ');
}

/**
 * An instance that reports errors needs its own Sentry ingest host in connect-src.
 * Deriving it from the configured DSN keeps the policy of every other instance
 * exactly as tight as it was.
 */
function monitoringOrigins(env: Record<string, string>): string[] {
  const dsn = env.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN;
  if (!dsn) return [];
  try {
    return [new URL(dsn).origin];
  } catch {
    throw new Error(`VITE_SENTRY_DSN is not a valid URL: ${dsn}`);
  }
}

/**
 * The CSP travels twice: as a meta tag inside index.html and as a response header
 * in web.config. Generating the header from the built HTML is what keeps them
 * equal — the script hash used to be copied by hand, and a stale copy blocks the
 * theme bootstrap in production while every local check still passes.
 */
function webConfigCsp(env: Record<string, string>, outDir: string): Plugin {
  return {
    name: 'web-config-csp',
    apply: 'build',
    closeBundle() {
      const htmlPath = path.join(outDir, 'index.html');
      const configPath = path.join(outDir, 'web.config');
      if (!existsSync(htmlPath) || !existsSync(configPath)) return;

      const csp = buildCsp(readFileSync(htmlPath, 'utf8'), 'header', monitoringOrigins(env));
      const config = readFileSync(configPath, 'utf8');
      const header = /(<add name="Content-Security-Policy" value=")[^"]*(")/;
      if (!header.test(config)) {
        throw new Error('web.config has no Content-Security-Policy header to fill.');
      }
      writeFileSync(configPath, config.replace(header, `$1${csp}$2`));
    },
  };
}

function siteMeta(env: Record<string, string>): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml: {
      // After Vite's own HTML pass: it re-indents the inline theme script, and a hash taken
      // earlier no longer matches what the browser executes
      order: 'post',
      handler(html, ctx) {
        // A Windows checkout with autocrlf hands Vite a CRLF template; the browser hashes the
        // bytes it receives, and the header in web.config is computed over LF. One line ending.
        const filled = html.replace(/\r\n/g, '\n').replace(/%(VITE_[A-Z0-9_]+)%/g, (_match, key: string) =>
          escapeHtml(env[key] ?? process.env[key] ?? META_DEFAULTS[key] ?? ''));
        const stamped = filled.replace('</title>', `</title>\n    <meta name="generator" content="${escapeHtml(`${PLATFORM_LABEL} ${pkg.version}`)}">`);
        if (ctx.server) return stamped;
        // The CSP hash covers inline scripts only: the meta tags around it do not move it
        return stamped.replace('</title>', `</title>\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp(stamped, 'meta', monitoringOrigins(env))}">`);
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
      plugins: [react(), siteMeta(env), brandOverlay(), versionManifest(), webConfigCsp(env, 'dist')],
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
                // Only present when the instance configured a DSN; loaded on demand
                { name: 'vendor-sentry', test: /node_modules[\\/]@sentry[\\/]/ },
              ],
            },
          },
        },
      },
      define: {
        __PLATFORM_VERSION__: JSON.stringify(pkg.version),
      },
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '.'),
        }
      }
    };
});
