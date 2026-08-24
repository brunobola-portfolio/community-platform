#!/usr/bin/env node
// Production distribution builder: validates .env.production, runs the
// type-checked build, applies the private brand overlay, generates SEO files,
// verifies the bundle and packages dist/ into the deploy-ready zip
// (index.html at the zip root, as the IIS/nginx guides expect).

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ZIP_NAME = 'community-platform-dist.zip';
// Real logos, photos, OG image and PWA manifest of a specific instance live
// here, gitignored; anything inside is copied over dist/ after the build
const BRAND_DIR = '.brand/public';
// Public routes worth indexing; blog posts are dynamic and stay out
const SITEMAP_ROUTES = ['', 'about', 'history', 'team', 'events', 'blog', 'gallery'];
const isWindows = process.platform === 'win32';

function fail(message, hint) {
  console.error(`\n  ERRO: ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

function step(label) {
  console.log(`\n  ${label}`);
}

function runNode(scriptPath, args, label) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });
  if (result.status !== 0) fail(`${label} falhou (exit ${result.status}).`);
}

function envValue(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

// 1. Validate production environment
step('[1/5] A validar .env.production...');
if (!existsSync('.env.production')) {
  fail(
    'Falta o ficheiro .env.production (usado pelo build de producao).',
    'Cria com: cp .env.production.example .env.production'
  );
}
const envContent = readFileSync('.env.production', 'utf8');
const convexUrl = envValue(envContent, 'VITE_CONVEX_URL');
if (!convexUrl) {
  fail(
    'VITE_CONVEX_URL vazio ou em falta no .env.production.',
    'Obtem o URL de producao com: npx convex dashboard --prod'
  );
}
const convexHost = new URL(convexUrl).host;
const siteUrl = envValue(envContent, 'VITE_SITE_URL').replace(/\/+$/, '');
console.log(`        Backend de producao: ${convexUrl}`);
console.log(`        Site publico: ${siteUrl || '(VITE_SITE_URL em falta — sitemap/robots nao gerados)'}`);

// 2. Build (tsc + vite, same as npm run build but with mode locked)
step('[2/5] Build de producao (tsc + vite build)...');
runNode('node_modules/typescript/bin/tsc', [], 'type-check (tsc)');
runNode('node_modules/vite/bin/vite.js', ['build', '--mode', 'production'], 'vite build');

// 3. SEO files from the env, then the brand overlay on top (overlay wins,
// so an instance can still ship hand-made robots.txt/sitemap.xml)
step('[3/5] SEO + brand overlay...');
if (siteUrl) {
  const urls = SITEMAP_ROUTES.map((route) => `  <url>\n    <loc>${siteUrl}/${route}</loc>\n    <changefreq>${route === '' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>`).join('\n');
  writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log('        sitemap.xml + robots.txt gerados.');
}
if (existsSync(BRAND_DIR)) {
  cpSync(BRAND_DIR, 'dist', { recursive: true, force: true });
  console.log(`        Overlay ${BRAND_DIR} aplicado (logos, fotos, og-image, manifest).`);
} else {
  console.log(`        Sem ${BRAND_DIR}: o build leva os assets genericos do repositorio.`);
}

// 4. Verify the bundle (automates DEPLOY.md "verificar o build")
step('[4/5] A verificar o build...');
for (const required of ['dist/index.html', 'dist/web.config', 'dist/og-image.png', 'dist/favicon.svg']) {
  if (!existsSync(required)) fail(`${required} nao foi gerado.`);
}
const assetDir = 'dist/assets';
const bundleHasUrl = readdirSync(assetDir)
  .filter((file) => file.endsWith('.js'))
  .some((file) => readFileSync(path.join(assetDir, file), 'utf8').includes(convexHost));
if (!bundleHasUrl) {
  fail(
    `O bundle nao contem ${convexHost} — o build nao usou o .env.production esperado.`,
    'Confirma VITE_CONVEX_URL no .env.production e repete npm run dist.'
  );
}
const html = readFileSync('dist/index.html', 'utf8');
if (/%VITE_[A-Z0-9_]+%/.test(html)) fail('index.html ainda tem placeholders %VITE_*% por preencher.');
console.log(`        index.html + web.config presentes; bundle aponta para ${convexHost}.`);

// 5. Package dist/ contents at the zip root. Tools attempted in order:
// bsdtar ships with Windows 10+/macOS and needs no PowerShell modules;
// Compress-Archive is the fallback since Microsoft.PowerShell.Archive
// fails to load on some Windows PowerShell 5.1 installs.
step(`[5/5] A criar ${ZIP_NAME}...`);
rmSync(ZIP_NAME, { force: true });
const zipAbs = path.resolve(ZIP_NAME);
const distEntries = readdirSync('dist');
const compressCmd = `Import-Module Microsoft.PowerShell.Archive; Compress-Archive -Path dist\\* -DestinationPath '${zipAbs}' -Force`;
const attempts = isWindows
  ? [
      ['tar', ['-a', '-cf', zipAbs, ...distEntries], { cwd: 'dist' }],
      ['pwsh', ['-NoProfile', '-Command', compressCmd], {}],
      ['powershell', ['-NoProfile', '-Command', compressCmd], {}],
    ]
  : [
      ['zip', ['-qr', zipAbs, '.'], { cwd: 'dist' }],
      ['tar', ['-a', '-cf', zipAbs, ...distEntries], { cwd: 'dist' }],
    ];
let packaged = false;
for (const [cmd, args, opts] of attempts) {
  rmSync(ZIP_NAME, { force: true });
  const result = spawnSync(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'], ...opts });
  if (result.status === 0 && existsSync(ZIP_NAME)) {
    console.log(`        Zip criado com ${cmd}.`);
    packaged = true;
    break;
  }
}
if (!packaged) {
  fail(
    'Criacao do zip falhou com todas as ferramentas (tar, pwsh, powershell).',
    isWindows
      ? 'Alternativa manual: botao direito na pasta dist > Send to > Compressed folder.'
      : 'Instala o utilitario zip (apt install zip).'
  );
}

const sizeKb = Math.round(statSync(ZIP_NAME).size / 1024);
console.log(`
  Distro pronta: ${ZIP_NAME} (${sizeKb} KB), com index.html na raiz do zip.

  Proximos passos:
    IIS/Windows -> DEPLOY.md Parte 3 (extrair para a pasta do site)
    VPS Linux   -> DEPLOY-VPS.md passo 2 (unzip para /var/www/<site>)
    Backend     -> npx convex deploy (se tambem mudou a pasta convex/)
`);
