#!/usr/bin/env node
// Dev launcher: detects processes already bound to the portal port,
// shows what they are and asks before killing, then starts Vite.
// Non-interactive shells (CI) skip the prompt and start Vite directly.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const isWindows = process.platform === 'win32';

function resolvePort() {
  // Mirror vite.config.ts: VITE_DEV_PORT from .env.local with 3000 fallback
  if (process.env.VITE_DEV_PORT) return parseInt(process.env.VITE_DEV_PORT, 10);
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    const match = readFileSync(file, 'utf8').match(/^VITE_DEV_PORT=(\d+)\s*$/m);
    if (match) return parseInt(match[1], 10);
  }
  return 3000;
}

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function pidsOnPort(port) {
  if (isWindows) {
    const out = run('netstat', ['-ano', '-p', 'TCP']);
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const cols = line.trim().split(/\s+/);
      if (cols[0] === 'TCP' && cols[3] === 'LISTENING' && cols[1]?.endsWith(`:${port}`)) {
        pids.add(parseInt(cols[4], 10));
      }
    }
    return [...pids].filter((pid) => Number.isFinite(pid) && pid > 0);
  }
  const out = run('lsof', ['-t', '-iTCP:' + port, '-sTCP:LISTEN']);
  return out.split(/\s+/).filter(Boolean).map(Number);
}

function describePid(pid) {
  if (isWindows) {
    const out = run('powershell', [
      '-NoProfile',
      '-Command',
      `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`,
    ]).trim();
    if (out) return out;
    const csv = run('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
    return csv.split('","')[0]?.replace(/^"/, '') || 'processo desconhecido';
  }
  return run('ps', ['-p', String(pid), '-o', 'args=']).trim() || 'processo desconhecido';
}

function killPid(pid) {
  if (isWindows) {
    run('taskkill', ['/PID', String(pid), '/T', '/F']);
  } else {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      /* already gone */
    }
  }
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim().toLowerCase());
  }));
}

function startVite(port) {
  // Launch the local vite binary through Node directly: avoids shell quoting
  // issues on Windows (DEP0190) and does not depend on npx being on PATH
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port)], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

const killMode = process.argv.includes('--kill');
const port = resolvePort();
const pids = pidsOnPort(port).filter((pid) => pid !== process.pid);

if (killMode && pids.length > 0) {
  for (const pid of pids) {
    console.log(`  A terminar PID ${pid} na porta ${port}: ${describePid(pid).slice(0, 120)}`);
    killPid(pid);
  }
  startVite(port);
} else if (pids.length === 0 || !process.stdin.isTTY) {
  if (pids.length > 0) {
    console.log(`Aviso: porta ${port} ocupada (PID ${pids.join(', ')}); o Vite escolhe a porta seguinte.`);
  }
  startVite(port);
} else {
  console.log(`\n  Porta ${port} ja esta ocupada:\n`);
  for (const pid of pids) {
    const desc = describePid(pid);
    const looksLikePortal = /vite|node/i.test(desc);
    console.log(`    PID ${pid}${looksLikePortal ? '' : '  (ATENCAO: nao parece ser o portal)'}`);
    console.log(`      ${desc.slice(0, 160)}\n`);
  }
  const answer = await ask(`  Matar ${pids.length > 1 ? 'estes processos' : 'este processo'} e arrancar na porta ${port}? (s/n) `);
  if (answer === 's' || answer === 'sim' || answer === 'y') {
    for (const pid of pids) killPid(pid);
    console.log('  Processos terminados. A arrancar o Vite...\n');
    startVite(port);
  } else {
    console.log(`  OK, a arrancar sem matar nada — o Vite escolhe a proxima porta livre.\n`);
    startVite(port);
  }
}
