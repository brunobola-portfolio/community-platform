# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Backoffice gallery manager: master-detail albums view, drag-and-drop multi-file
  upload straight to Convex storage with per-file status, inline captions, arrow
  reordering persisted per album, cover chosen among the album's photos, single and
  bulk delete with storage cleanup (`albums.updateImage/removeImage/reorderImages/setCoverImage`)

### Changed

- **Fully generic repository**: no versioned file names a real association. New
  identity settings (full name, locality, region, founding year, hero copy, venue,
  history intro/quote, founders note) editable in Admin > Definições > Identidade &
  Textos; `index.html` meta tags filled from `%VITE_*%` at build; private brand overlay
  `.brand/public/` (dev middleware + `npm run dist` copy); sitemap/robots generated from
  `VITE_SITE_URL`; demo seed is a fictitious association with placeholder media
- White-label pass: runtime identity (AI assistant persona, chat suggestions, footer,
  page titles) now derives from database settings instead of hardcoded strings
- Footer credit "Community Platform by BolaLabs"; `.github/FUNDING.yml`; release
  workflow and deploy zip renamed `community-platform-dist.zip`
- AI model defaults unified in `convex/lib/aiDefaults.ts` — frontend and server actions
  now advertise and call the same models (`gemini-3-flash-preview` chat,
  `gemini-2.5-flash` fallback, `gemini-2.5-flash-image` image)
- Chat classification category renamed `ARCVA` → `ASSOCIACAO`
- Geo coordinates accept generic `SITE_LATITUDE`/`SITE_LONGITUDE` env vars
  (legacy `ARCVA_*` still honored)
- `theme-color` and PWA manifest colors aligned with the design system dark
  background (#020617); CSP `font-src` now includes `'self'`
- Documentation rebuilt for the public release: bilingual README (EN/PT),
  CONTRIBUTING, SECURITY, WHITE-LABEL and DESIGN-SYSTEM guides, split
  AGENTS.md/CLAUDE.md

## [2.0.0] — 2026-07-12

First production release, live at [arcva.pt](https://arcva.pt).

### Added

- Public portal: home, history (editable timeline), about with AI geo-assistant, team,
  events with dynamic registration forms and calendar export, blog with TTS reading,
  gallery with lightbox, member area with digital card and dues status
- AI assistant with RAG over portal data, input classification guardrails, multi-turn
  history, clickable navigation links and quick-reply suggestions
- Multi-provider AI layer: Gemini (default, with grounding), OpenRouter, or any
  OpenAI-compatible endpoint (Ollama, LM Studio, vLLM); write-only provider keys
- Admin panel with 16 management tabs, including AI configuration and usage analytics
- Media Studio: multi-model image generation (1K–4K), tone-aware text enhancement, TTS
- Convex backend: auth guards, token-bucket rate limiting, server-side sanitization,
  cascade delete with storage cleanup, cleanup crons
- `/setup` wizard for no-CLI admin bootstrap; `npm run dist` deploy packaging;
  dev launcher with busy-port detection
- Deploy guides for IIS/Windows and Linux VPS with nginx

[Unreleased]: https://github.com/brunobola-portfolio/community-platform/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/brunobola-portfolio/community-platform/releases/tag/v2.0.0
