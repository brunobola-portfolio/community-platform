import { describe, expect, it } from 'vitest';
import { buildCsp } from '../vite.config';

const HTML = `<!doctype html><html><head><title>x</title>
<script>document.documentElement.classList.add('dark')</script>
</head><body><div id="root"></div></body></html>`;

/** Reads one directive out of a policy string. */
function directive(policy: string, name: string): string {
  const found = policy.split('; ').find((part) => part.startsWith(`${name} `));
  if (!found) throw new Error(`no ${name} in policy`);
  return found;
}

describe('buildCsp', () => {
  it('allows the inline theme script by hash instead of unsafe-inline', () => {
    const policy = buildCsp(HTML);
    expect(policy).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
    expect(policy).not.toContain("'unsafe-inline'  ");
    expect(directive(policy, 'script-src')).not.toContain("'unsafe-inline'");
  });

  it('changes the hash when the inline script changes', () => {
    // The trap this guards: an edited theme bootstrap with a stale hash is
    // blocked in production while every local check still passes
    const edited = HTML.replace("'dark'", "'light'");
    expect(buildCsp(HTML)).not.toBe(buildCsp(edited));
  });

  it('keeps frame-ancestors in the header and out of the meta tag', () => {
    // Browsers ignore frame-ancestors in a meta tag and log a warning for it
    expect(buildCsp(HTML, 'header')).toContain("frame-ancestors 'self'");
    expect(buildCsp(HTML, 'meta')).not.toContain('frame-ancestors');
  });

  it('lets the portal reach its own Convex backend and nothing else by default', () => {
    expect(directive(buildCsp(HTML), 'connect-src'))
      .toBe("connect-src 'self' https://*.convex.cloud wss://*.convex.cloud");
  });

  it('adds only the monitoring origin an instance actually configured', () => {
    const policy = buildCsp(HTML, 'header', ['https://o4508.ingest.de.sentry.io']);
    expect(directive(policy, 'connect-src'))
      .toBe("connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://o4508.ingest.de.sentry.io");
    // No wildcard host: an instance without monitoring keeps the tighter policy
    expect(policy).not.toContain('*.sentry.io');
  });

  it('never loosens the directives that contain an XSS', () => {
    for (const target of ['header', 'meta'] as const) {
      const policy = buildCsp(HTML, target);
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("base-uri 'self'");
      expect(policy).toContain("form-action 'self'");
      expect(policy).toContain("default-src 'self'");
    }
  });
});
