#!/usr/bin/env node
// Production distribution builder: validates .env.production, runs the
// type-checked build, verifies the bundle and packages dist/ into the
// deploy-ready arcva-v2-dist.zip (index.html at the zip root, as the
// IIS/nginx guides expect). Single entry point referenced by DEPLOY.md.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const ZIP_NAME = 'arcva-v2-dist.zip';
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

// 1. Validate production environment
step('[1/4] A validar .env.production...');
if (!existsSync('.env.production')) {
  fail(
    'Falta o ficheiro .env.production (usado pelo build de producao).',
    'Cria com: cp .env.production.example .env.production'
  );
}
const envContent = readFileSync('.env.production', 'utf8');
const urlMatch = envContent.match(/^VITE_CONVEX_URL=(\S+)\s*$/m);
if (!urlMatch) {
  fail(
    'VITE_CONVEX_URL vazio ou em falta no .env.production.',
    'Obtem o URL de producao com: npx convex dashboard --prod'
  );
}
const convexUrl = urlMatch[1];
const convexHost = new URL(convexUrl).host;
console.log(`        Backend de producao: ${convexUrl}`);

// 2. Build (tsc + vite, same as npm run build but with mode locked)
step('[2/4] Build de producao (tsc + vite build)...');
runNode('node_modules/typescript/bin/tsc', [], 'type-check (tsc)');
runNode('node_modules/vite/bin/vite.js', ['build', '--mode', 'production'], 'vite build');

// 3. Verify the bundle (automates DEPLOY.md "verificar o build")
step('[3/4] A verificar o build...');
for (const required of ['dist/index.html', 'dist/web.config']) {
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
console.log(`        index.html + web.config presentes; bundle aponta para ${convexHost}.`);

// 4. Package dist/ contents at the zip root. Tools attempted in order:
// bsdtar ships with Windows 10+/macOS and needs no PowerShell modules;
// Compress-Archive is the fallback since Microsoft.PowerShell.Archive
// fails to load on some Windows PowerShell 5.1 installs.
step(`[4/4] A criar ${ZIP_NAME}...`);
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
    IIS/Windows -> DEPLOY.md Parte 3 (extrair para C:\\inetpub\\arcva-v2\\)
    VPS Linux   -> DEPLOY-VPS.md passo 2 (unzip para /var/www/arcva)
    Backend     -> npx convex deploy (se tambem mudou a pasta convex/)
`);
