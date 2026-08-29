# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.5.0] - 2026-08-29

### Fixed

- **The backoffice ignored its own dark styling for anyone browsing the portal in
  light mode**: `/admin` and `/setup` now declare `dark` on their root, so shared
  dialogs, inputs and buttons stop rendering light-theme colours on a dark panel
  (form fields were an unreadable grey block, outline buttons looked disabled)
- Sponsors saved from the backoffice stored the tier display name while the portal
  looked the tier up by id, so an edited partner lost its level on the public site;
  both resolve through `utils/sponsorTiers.ts` now, and the form writes the id
- Long table content is scrollable instead of clipped (the wrapper had
  `whitespace-nowrap` inside `overflow-hidden`)
- Delete, duplicate and edit are available on mobile for every entity — sponsors,
  categories, documents and notifications only offered edit
- Homepage stats could not be created at all, and their actions only appeared on
  hover, which never happens on touch

### Added

- `EntityList`: one list surface for every entity tab (search, filter chips with
  counts, sort, result counter, desktop table, mobile cards, loading skeletons,
  empty-collection and no-results states) — sponsors, categories, tiers, documents,
  notifications and milestones gained everything events/news/members already had
- Real error messages: mutations return their failure text and
  `describeActionError` turns validator dumps and auth failures into instructions
  ("Há campos por preencher…", "A sessão expirou…") instead of "Erro de validação"
- Unsaved-changes guard on the entity form, a busy state on delete, and a settings
  save that reports success or failure instead of always claiming success
- Section descriptions in the page header explaining what each tab controls on the
  public site, plus a "Ver site" shortcut
- Cascade warnings in the delete dialog (album photos, event registrations,
  category references) and consistent confirmation across the panel

### Changed

- Activity log entries name the record ("Evento atualizado: Torneio…") instead of
  printing a document id
- Registration details, quota removal and the quota form moved onto the shared
  dialog shell; leads and quotas dropped their duplicated headings
- Entity forms split into `pages/admin/forms/` (content, people, system) and every
  admin file is back under the 300-line budget; no `any` left in application code

## [2.4.0] - 2026-08-29

### Added

- Dialog shell with slots (`components/ui/Modal.tsx`): branded icon chip, eyebrow,
  title, description and a sticky footer for the actions, plus `aria-describedby`,
  focus on the first body control instead of the close button, Escape bound to the
  document (multi-step dialogs kept losing it) and Tab pulling focus back into the
  dialog after a step change

### Changed

- **Every dialog uniformised on the new shell**: agenda, contact, login, event
  details, event registration, partner details, sponsorship wizard, action area and
  quota payment now share one header rhythm, one scrolling body and one action bar;
  the ad-hoc info banners, duplicated titles and per-modal footers are gone
- Agenda redesigned: month sections with counts, a date chip on every row (also on
  mobile), truncation-safe layout and a real empty state
- Sponsorship wizard shows the step in the eyebrow, tier cards flattened to one
  consistent card style, tier icons matched on id or name (pt and en) instead of
  English-only ids, and "Doação anual" only shows for priced tiers
- Contact modal dropped the external texture image (third-party request) and the
  gradient banner that repeated the header
- `EmptyState` is theme-aware (it was dark-only) and now used by the agenda

## [2.3.0] - 2026-08-29

### Added

- Category colour palette (`utils/categoryColors.ts`) shared by the backoffice picker
  and the Tailwind `safelist`: colours stored in the database are now always compiled,
  and the category form picks them from swatches instead of a Tailwind class dropdown
- `aria-label`/`title` on every icon-only action button of the admin entity tables

### Changed

- **Assistant redesign**: the chat panel is anchored bottom-right (bottom sheet on
  mobile), with a gradient header and live status, per-turn assistant avatar, branded
  user bubbles, an inline "Ouvir" action instead of the in-bubble divider, animated
  typing indicator, a single composer field holding input + microphone + send, and an
  AI disclaimer; turn rendering moved to `components/ai/ChatMessage.tsx`, which now also
  renders markdown headings instead of leaking `##` into the bubble
- Navbar fits every desktop width: the bar keeps its side margins (no more full-bleed
  under 1350px) and between `lg` and `xl` the action buttons collapse to labelled icons,
  so Agenda/Sócio/Reservado are never clipped
- Event category chips wrap from `lg` up instead of scrolling out of sight
- OpenRouter chat now walks the whole fallback chain on any upstream failure (retired
  slug, 429, provider 5xx) and only aborts on credential errors, then falls back to
  Gemini; provider 5xx maps to `ERR_UNAVAILABLE` and `ERR_GENERIC` has friendly copy
- Assistant identity unified on the `Sparkles` mark and the brand gradient (floating
  button, hero AI search, chat header and avatars)
- Home scroll cue only shows where it fits (`md` and viewport height ≥ 760px)

## [2.2.0] - 2026-08-28

### Added

- Backoffice list toolbar (`useAdminList` + `AdminListToolbar`): search with `/`
  shortcut, filter chips with live counts (upcoming/past/tournaments/drafts,
  published/drafts, governing body), sort, result counter and empty states on the
  Events, News and Members tabs; contextual primary action ("Novo evento", "Nova
  notícia"…) and record count in the page header; tournament occupancy shows 0/N
  instead of /N
- `templates/instance/` and `docs/INSTANCE-REPO.md`: the private instance repository
  pattern (env + brand + backups + `platform.lock`, `apply.ps1`, IIS `install.ps1` with
  backup/smoke test/rollback, self-hosted runner workflow) for running the platform for
  any association without client data in the public product
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

[Unreleased]: https://github.com/brunobola-portfolio/community-platform/compare/v2.5.0...HEAD
[2.5.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.0.0...v2.2.0
[2.0.0]: https://github.com/brunobola-portfolio/community-platform/releases/tag/v2.0.0
