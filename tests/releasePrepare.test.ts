import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.resolve('scripts/release-prepare.mjs');
const CHANGELOG = `# Changelog

## [Unreleased]

## [2.9.1] - 2026-09-09

### Added

- A thing worth releasing

## [2.9.0] - 2026-09-08

### Fixed

- An older thing
`;

const dirs: string[] = [];

function workspace(version: string, changelog = CHANGELOG) {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-prepare-'));
  dirs.push(dir);
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x', version }));
  writeFileSync(path.join(dir, 'CHANGELOG.md'), changelog);
  return dir;
}

/** Runs the guard the way the release workflow does, returning stdout or the failure. */
function run(dir: string, tag: string, actions = false) {
  // Cleared by default: the child would otherwise inherit GITHUB_ACTIONS from a
  // CI run and annotate the workflow with failures these fixtures expect
  const env = { ...process.env, GITHUB_ACTIONS: actions ? 'true' : '' };
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, tag], { cwd: dir, encoding: 'utf8', env });
    return { ok: true as const, stdout, notes: readFileSync(path.join(dir, 'RELEASE_NOTES.md'), 'utf8') };
  } catch (error) {
    const failure = error as { status: number; stderr: string };
    return { ok: false as const, status: failure.status, stderr: failure.stderr };
  }
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe('release-prepare', () => {
  it('writes the notes for a tag that matches package.json', () => {
    const result = run(workspace('2.9.1'), 'v2.9.1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.notes).toContain('A thing worth releasing');
  });

  it('stops at the next version heading', () => {
    const result = run(workspace('2.9.1'), 'v2.9.1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The older entry belongs to its own release page, not to this one
    expect(result.notes).not.toContain('An older thing');
    expect(result.notes).not.toContain('## [2.9.0]');
  });

  it('refuses a tag the artifact would contradict', () => {
    // The zip stamps package.json into version.json, so a mismatched tag would
    // publish a release page the download denies
    const result = run(workspace('2.9.1'), 'v3.0.0');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not match package.json');
  });

  it('refuses a version nobody wrote a changelog entry for', () => {
    const result = run(workspace('4.0.0', '# Changelog\n\n## [Unreleased]\n'), 'v4.0.0');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stderr).toContain('no "## [4.0.0]" section');
  });

  it('refuses an entry that exists but says nothing', () => {
    const empty = '# Changelog\n\n## [4.0.0] - 2026-09-09\n\n## [3.0.0] - 2026-01-01\n\n- old\n';
    const result = run(workspace('4.0.0', empty), 'v4.0.0');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stderr).toContain('is empty');
  });

  it('annotates the workflow only when it runs inside one', () => {
    const plain = run(workspace('2.9.1'), 'v3.0.0');
    const inActions = run(workspace('2.9.1'), 'v3.0.0', true);
    expect(plain.ok).toBe(false);
    expect(inActions.ok).toBe(false);
    if (plain.ok || inActions.ok) return;
    // A green CI run must not be decorated with these fixtures' failures
    expect(plain.stderr).not.toContain('::error::');
    expect(inActions.stderr).toContain('::error::');
  });

  it('accepts a pre-release tag whose package.json agrees', () => {
    const rc = '# Changelog\n\n## [3.0.0-rc.1] - 2026-09-09\n\n- release candidate\n';
    const result = run(workspace('3.0.0-rc.1', rc), 'v3.0.0-rc.1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.notes).toContain('release candidate');
  });
});
