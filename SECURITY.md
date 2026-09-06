# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 2.x | Yes |
| < 2.0 | No |

## Reporting a vulnerability

Please do **not** open a public issue for security vulnerabilities.

Email **[bruno@bolalabs.pt](mailto:bruno@bolalabs.pt)** with:

- A description of the vulnerability and its impact
- Steps to reproduce (a proof of concept helps)
- Any suggested remediation

You will receive an acknowledgment within 72 hours. Please allow a reasonable window for a
fix before any public disclosure; credit is given in the release notes unless you prefer
otherwise.

## Scope notes for deployers

This platform processes member personal data (names, emails, dues records) and holds AI
provider keys. When deploying an instance:

- `GEMINI_API_KEY` and provider keys belong in the Convex deployment environment only —
  never in `.env` files committed to git, and never in the frontend bundle
- Provider keys stored via the admin panel are write-only: they are never returned by
  `settings.getPublic` / `settings.getAdmin`
- All admin mutations are guarded by `requireAdmin(ctx)`; report any code path that isn't
- Public mutations are rate-limited (token bucket); the chat has injection guardrails, but
  guardrails are a mitigation, not a boundary — the RAG context only contains published data
- The Content-Security-Policy is generated at build time by `vite.config.ts` (the theme
  bootstrap is allowed by SHA-256 hash, not `'unsafe-inline'`) and mirrored as a response
  header in `public/web.config`; if you change the inline script, rebuild and copy the new
  hash into the header
- **Real personal/contact data (phone numbers, IBAN, MB WAY) never belongs in the
  repository** — not in seeds, defaults or migrations. It lives in the production DB
  settings (Admin > Definições) or in gitignored `.env` files; the repo carries only
  obviously fictitious placeholders

## Known limitations

Documented so deployers can decide whether they matter for their association:

- **Sign-up is open and emails are not verified.** The Password provider has no email
  verification step, so a member's quota record (`memberProfiles`, keyed by email) is
  visible to whoever registers with that address first. Mitigation today: strong password
  policy, no sign-up link on the admin dialog. Planned: an email-verification provider.
- **No sign-in throttling at the auth HTTP routes.** Convex Auth does not expose a hook for
  it; the password policy (10+ chars, mixed case, digit) is the current control.
- **Documents are all world-readable.** `documents.list` has no visibility flag; do not
  upload minutes or member lists you would not publish on the site.
- **Images uploaded through the Media Studio are referenced by URL**, so deleting the
  entity leaves the blob in Convex storage. Remove orphans from the Convex dashboard.
- **Chat classification fails open.** If the classifier call errors, the message is treated
  as a general question and still answered by the constrained system prompt.
