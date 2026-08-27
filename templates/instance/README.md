# Instance repository template

Private repository for **one association's** deployment of the Community Platform. It
holds everything that identifies the instance and must never live in the public product:
environment files, brand assets, database backups, operator notes — plus the automation
that applies those layers on top of a published platform version and deploys the result.

It contains **no application code**. Updating the site means changing the version in
`platform.lock` and pushing.

```
env/            .env.production (build + meta tags) and .env.local (dev)
brand/public/   logo.svg, favicon.svg, og-image.png, manifest.json, images/**
backups/        npx convex export snapshots of the production database
docs/           operator runbook, credentials inventory (no secrets), notes
platform.lock   platform version in production (tag vX.Y.Z or a branch)
apply.ps1       applies the layers onto the platform and builds the deploy zip
deploy/         install.ps1 — installs a zip on IIS with backup, smoke test, rollback
.github/        deploy.yml — runs apply + install on a self-hosted runner
```

## First-time setup

1. Create a **private** repository from this folder (`templates/instance` of the platform).
2. Copy `.env.production.example` and `.env.local.example` from the platform into `env/`
   and fill in the identity (`VITE_*`), the production and dev Convex URLs.
3. Put the association's assets in `brand/public/` (same structure as the platform's
   `public/`; every file replaces the generic one). See the platform's `docs/WHITE-LABEL.md`.
4. Write the platform version in `platform.lock` (a released tag, e.g. `v2.1.0`).
5. Edit `deploy/install.ps1` defaults (`$SiteUrl`, `$SitePath`) and the runner label in
   `.github/workflows/deploy.yml` if you run more than one instance on the same runner.

## Daily use

```powershell
.\apply.ps1                  # dev: layers onto ..\<platform-folder>, builds the zip
.\apply.ps1 -ApplyOnly       # only copy env + brand into the platform checkout
.\apply.ps1 -Clone           # reproducible build of platform.lock in .\platform
.\deploy\install.ps1 -Zip <zip>   # on the server, by hand
```

With the self-hosted runner installed on the server, a push that changes
`platform.lock`, `env/`, `brand/`, `deploy/` or `apply.ps1` deploys automatically:
backend (if `CONVEX_DEPLOY_KEY` secret exists), then frontend with backup, smoke test and
automatic rollback.

## Rules

- This repository never gets a public remote.
- Secrets that are not `VITE_*` (Gemini key, provider keys) live in the Convex deployment
  environment, never here.
- Personal data (phone numbers, IBAN) lives in the production database, configured in the
  admin panel.
- Back up the database monthly: `npx convex export --prod --path backups/backup-YYYY-MM.zip`.
