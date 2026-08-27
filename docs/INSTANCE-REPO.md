# Instance repositories — running the platform for a client

The platform is generic; **each association is an instance**: its own Convex project, its
own private repository with the identity layers, and its own server (or a folder on a
shared one). This document is the operator's playbook for launching and running instances
without ever putting client data in the public product.

```
public product (this repo)            private instance repo (one per client)
──────────────────────────            ───────────────────────────────────────
code, docs, CI, releases              env/  brand/  backups/  docs/
tag vX.Y.Z  ──────────────────▶       platform.lock = vX.Y.Z
                                       apply.ps1 ─▶ build with the brand ─▶ install.ps1 ─▶ IIS
```

The instance repository holds no code, so there is nothing to merge or keep in sync: it
*applies* its layers onto a released version. Updating a client is changing one line.

## 1. Launch a new instance (about one hour)

### 1.1 Convex project (backend + database)

```bash
npx convex login
npx convex dev --once --configure=new     # creates the dev deployment, writes .env.local
npx convex deploy --yes                   # creates the production deployment
npx convex env set GEMINI_API_KEY "AIza..." --prod
npx @convex-dev/auth --prod --web-server-url https://www.<domain> --skip-git-check --allow-dirty-git-state
```

Note the two deployment names (`npx convex dashboard`); they go into the instance's env files.

### 1.2 Private repository from the template

Copy [`templates/instance/`](../templates/instance/) into a new **private** repository
(`<org>/<client>-instance`). Then:

- `env/.env.production` — from `.env.production.example`: `VITE_CONVEX_URL` (production),
  `VITE_SITE_URL`, `VITE_SITE_NAME`, `VITE_SITE_FULL_NAME`, description, keywords, OG
  tagline, `VITE_LOGO_URL=/logo.svg`, locality, founding year, hero copy, venue, history
  intro, contacts, socials, coordinates. Everything the `index.html` meta tags and the
  first render need before the database answers.
- `env/.env.local` — same, pointing at the dev deployment (`CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`).
- `brand/public/` — `logo.svg`, `favicon.svg`, `og-image.png` (1200x630), `manifest.json`,
  `images/**` for team photos, posters and partner logos (referenced from the database as
  `/images/...`).
- `platform.lock` — the released tag to run (start with the latest).
- `deploy/install.ps1` defaults (`$SiteUrl`, `$SitePath`) or the `SITE_URL`/`SITE_PATH`
  repository variables.

Never give this repository a public remote. Keys that are not `VITE_*` stay in the Convex
environment.

### 1.3 Database (admin panel)

Deploy once (below), open `/setup` to create the admin, then fill **Admin → Definições**
(identity & texts, contacts, logo URL, payments) and **Admin → IA & Chatbot** (provider,
models, test connection). Add content: events, news, team, founders (group "founder"),
partners, gallery. The database is the source of truth; env values only cover the first
render and build-time meta tags.

### 1.4 Server (Windows + IIS)

One-time on the VPS: IIS with URL Rewrite, a site bound to the domain on 80/443 with a
certificate (Certify The Web or win-acme renew through `/.well-known/acme-challenge/`,
which the shipped `web.config` allows), Node LTS and Git (`winget`), and a GitHub Actions
self-hosted runner registered on the instance repository with the label used in
`deploy.yml` (run as a service under `NT AUTHORITY\SYSTEM` so it can write to the site
folder). Linux + nginx works the same way with [DEPLOY-VPS.md](../DEPLOY-VPS.md) and a
shell equivalent of `install.ps1`.

### 1.5 First deploy

Actions → Deploy → Run workflow. The runner clones the platform at `platform.lock`, applies
the layers, builds, deploys the backend (when the `CONVEX_DEPLOY_KEY` secret exists),
backs up the site folder, installs, smoke-tests the public URL and rolls back on failure.

## 2. Update an instance

| Change | What to do |
|--------|------------|
| Content (events, news, settings) | Nothing — the admin panel publishes in realtime |
| New platform version | Set `platform.lock` to the new tag, push. Backend goes first automatically with the secret; otherwise run `npx convex deploy --yes` from a platform checkout before pushing |
| Brand or build-time texts | Edit `brand/` or `env/`, push |
| Retired AI model | Admin → IA & Chatbot → pick the new one (the chat self-heals meanwhile) |

Order rule: **backend before frontend** whenever the release touched `convex/`.

## 3. Operate

- **Backups**: `npx convex export --prod --path backups/backup-YYYY-MM.zip`, monthly, committed
  to the instance repo. The site folder is backed up automatically before each deploy
  (`C:\inetpub\backups`, last 5 kept).
- **Rollback**: frontend — restore the previous backup folder (seconds); backend — deploy
  the previous tag.
- **Keys**: rotate the Gemini key yearly (`npx convex env set GEMINI_API_KEY … --prod`);
  provider keys are write-only in the admin panel.
- **Another machine**: clone the platform and the instance repos side by side,
  `npm ci`, `npx convex login`, `.\apply.ps1 -ApplyOnly`, `npx convex dev`.
- **Several instances on one server**: one runner per instance repository (different
  labels, different `SITE_PATH`), or one runner with several labels.

## 4. What never leaves the instance repo

Real names in seeds or docs of the public product, phone numbers, IBAN, photographs of
members, partner logos, deployment names, server hostnames. The public product ships a
fictitious demo association on purpose.
