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

- **Registration without an account is open by design and rate-limited, not verified.**
  Events accept guests unless set to "members only". Each guest registration is limited per
  email (hashed), per browser session and globally, carries a honeypot field, and waits as
  "pending" for the board. An event holds at most 40 unconfirmed guest registrations, so a
  script cannot fill it; a determined abuser who rotates emails and sessions can still create
  that many pending rows, which the board cancels in bulk. The email address is not verified:
  someone could register another person's address. A duplicate is answered, not thrown, so
  probing whether an address is registered spends rate-limit tokens.
- **Guest registration data is kept 90 days after the event** (30 days if cancelled), then
  deleted by a daily cron; the privacy notice at `/privacidade` says so.
- **A guest registration can send one email to an address nobody verified.** With email on,
  "registration received" goes to the address typed in the form. The message is a fixed
  template (the name is escaped and stripped of line breaks, nothing else the visitor typed is
  in it), each address is rate-limited, and all email a visitor can trigger shares a budget of
  150 an hour, so the site cannot be used as a bulk mailer. The board's own sends are not
  limited by it.

Documented so deployers can decide whether they matter for their association:

- **There is no self sign-up; accounts are given in Acessos.** Since 2.19.1 the server refuses
  any account it did not create itself (the first-run `/setup` aside), so nobody can register
  someone else's address to read their dues record. Passwords are reset by an administrator,
  never sent by email.
- **No sign-in throttling at the auth HTTP routes.** Convex Auth does not expose a hook for
  it; the password policy (10+ chars, mixed case, digit) is the current control.
- **Documents are visible to every signed-in account**, not only to dues-paying members;
  `documents.list` refuses anonymous callers but has no per-document visibility flag.
- **Email provider keys live in the database unless the deployment provides them.** They are
  write-only (no query returns them; the backoffice shows "Guardada") and every admin mutation
  checks the role, but anyone with access to the Convex dashboard or a database export can read
  them. Deployers who prefer otherwise set `RESEND_API_KEY`, `BREVO_API_KEY`,
  `POSTMARK_SERVER_TOKEN`, `MS_GRAPH_CLIENT_SECRET` or `SMTP_PASSWORD` on the deployment and
  leave the field empty. The delivery log keeps each email's content for 90 days.
- **A chat turn is refused when the guardrail classifier cannot run.** Since 2.8.0 the
  classifier fails closed: it retries, then falls back to Gemini when a key is configured,
  and if no verdict can be produced the assistant answers `ERR_UNAVAILABLE` rather than
  forwarding an unchecked message to the model. A deployment whose only provider is an
  unreachable custom endpoint therefore has no assistant until the endpoint recovers.
- **Images replaced before 2.13.5 may still be in storage.** Uploads are reference-counted
  since then and unused ones are swept after 48 h; files swapped earlier were never linked to a
  record and can only be removed from the Convex dashboard.
