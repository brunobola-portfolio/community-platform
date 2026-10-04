import { describe, expect, it } from 'vitest';
import { compareVersions, githubRepo, updateStatus } from '../convex/lib/semver';

describe('version badge', () => {
  it('compares numerically, not as text', () => {
    expect(compareVersions('2.10.0', '2.9.9')).toBeGreaterThan(0);
    expect(compareVersions('v2.17.0', '2.17.0')).toBe(0);
    expect(compareVersions('2.16.3', '2.17.0')).toBeLessThan(0);
  });

  it('says current, behind or ahead, and unknown without data', () => {
    expect(updateStatus('2.17.0', '2.17.0')).toBe('current');
    expect(updateStatus('2.16.0', '2.17.0')).toBe('behind');
    expect(updateStatus('2.18.0', '2.17.0')).toBe('ahead');
    expect(updateStatus('2.17.0', null)).toBe('unknown');
    expect(updateStatus('dev', '2.17.0')).toBe('unknown');
  });

  it('reads owner/repo from the package repository URL', () => {
    expect(githubRepo('https://github.com/brunobola-portfolio/community-platform')).toBe('brunobola-portfolio/community-platform');
    expect(githubRepo('git+https://github.com/acme/site.git')).toBe('acme/site');
    expect(githubRepo('https://gitlab.com/x/y')).toBeNull();
  });
});
