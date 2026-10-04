import { describe, expect, it } from 'vitest';
import { normalizeEmail, passwordProblem, roleChangeProblem, temporaryPassword } from '../convex/lib/accessRules';

describe('temporary passwords', () => {
  it('always satisfy the sign-up rule and read as three groups of four', () => {
    for (let i = 0; i < 500; i++) {
      const password = temporaryPassword();
      expect(password).toMatch(/^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
      expect(passwordProblem(password)).toBeNull();
    }
  });

  it('never use characters that are confused when dictated', () => {
    const sample = Array.from({ length: 200 }, () => temporaryPassword()).join('');
    expect(sample).not.toMatch(/[0O1lI]/);
  });

  it('still hold the rule when the random source is degenerate', () => {
    expect(passwordProblem(temporaryPassword(() => 0))).toBeNull();
  });
});

describe('password rule', () => {
  it('matches the provider: 10+ chars with upper, lower and a digit', () => {
    expect(passwordProblem('curta1A')).toMatch(/10 caracteres/);
    expect(passwordProblem('semnumerosAA')).toMatch(/maiúsculas/);
    expect(passwordProblem('ValeAlto2026')).toBeNull();
  });
});

describe('role changes', () => {
  const base = { actorId: 'a', targetId: 'b', adminCount: 2 } as const;

  it('nobody removes their own access', () => {
    expect(roleChangeProblem({ ...base, targetId: 'a', targetRole: 'admin', nextRole: 'user' })).toMatch(/próprio/);
    expect(roleChangeProblem({ ...base, targetId: 'a', targetRole: 'admin', nextRole: 'removed' })).toMatch(/próprio/);
  });

  it('the last admin cannot be demoted or removed', () => {
    expect(roleChangeProblem({ ...base, adminCount: 1, targetRole: 'admin', nextRole: 'user' })).toMatch(/pelo menos um/);
    expect(roleChangeProblem({ ...base, adminCount: 1, targetRole: 'admin', nextRole: 'removed' })).toMatch(/pelo menos um/);
  });

  it('promoting, and demoting one of several admins, are allowed', () => {
    expect(roleChangeProblem({ ...base, targetRole: 'user', nextRole: 'admin' })).toBeNull();
    expect(roleChangeProblem({ ...base, targetRole: 'admin', nextRole: 'user' })).toBeNull();
  });
});

it('emails compare without case or spaces', () => {
  expect(normalizeEmail('  ArcvaLealto@Gmail.com ')).toBe('arcvalealto@gmail.com');
});
