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
- Keep the restrictive Content-Security-Policy in `index.html` when customizing
- **Real personal/contact data (phone numbers, IBAN, MB WAY) never belongs in the
  repository** — not in seeds, defaults or migrations. It lives in the production DB
  settings (Admin > Definições) or in gitignored `.env` files; the repo carries only
  obviously fictitious placeholders
