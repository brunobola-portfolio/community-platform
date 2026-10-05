# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.19.3] - 2026-10-05

### Fixed

- A wrong password in production showed "Erro na autenticação": Convex redacts the sign-in error
  to "Server Error". Any refused sign-in that is not a network failure now reads "Email ou
  palavra-passe incorretos", with what to do after several attempts

## [2.19.2] - 2026-10-05

### Fixed

- **Signing in took two tries.** The dialog navigated to the backoffice or member area as soon
  as the password was accepted, before the Convex client had re-authenticated; the protected
  route still saw a signed-out visitor and sent them back to the home page. The dialog now keeps
  "Entrar" spinning until the session is open (with a clear message if it takes over 10 s)

## [2.19.1] - 2026-10-05

### Changed

- **No self sign-up.** Accounts are given by an administrator in Acessos (so each one has the
  right role and can be tied to a member); the server refuses any other sign-up once an
  administrator exists, while the first-run /setup still works. The sign-in dialog drops
  "Não tem conta? Registar" and says how to ask the board for an account or a new password,
  linking to the public guide "Pedir conta ou nova palavra-passe"

## [2.19.0] - 2026-10-04

Each association looks like its own brand guide, and the help center reads like a friendly
manual.

### Added

- **Brand system v2: every instance on-brand from its brand guide values.** The palette is now
  generated in OKLCH (hue kept, chroma shaped per step like Tailwind's palettes), so a red's
  tints stay red/coral instead of turning pink; every AA guarantee of the old scale holds
- **Brand-tinted neutrals**: all `slate-*` classes and the dark background/surfaces follow a
  neutral scale with the brand hue at low chroma (warm near-blacks for a red, cool for indigo,
  pure grey for a grey or black brand), with Tailwind slate's exact luminance per step so every
  text contrast stays the same
- **Display colour for large titles** (`text-brand-display`): the brand colour itself in the
  dark theme whenever it reaches 3:1, instead of the pastel brand-400 meant for body text
- **Accent colour** (Definições > Marca, `VITE_ACCENT_COLOR`): the second colour of the guide
  drives title gradients, glows and the founders' badge; empty means automatic (gold, or a warm
  coral for gold-like brands). The "Destaque" badge and warnings keep their fixed colours
- **Mono font** (Geist Mono by default, plus JetBrains Mono, IBM Plex Mono, DM Mono, Space
  Mono; `VITE_FONT_MONO`) for dates, eyebrows and labels instead of the system monospace
- Backoffice brand preview shows the display word, the accent gradient and the mono line, and
  the contrast panel reports brand, display and accent
- Smooth light/dark switch (View Transitions API; instant with reduced motion or older browsers)
- **Help center, easier to follow**: 44 guides rewritten in plain language (one action per step,
  exact button names in bold, "Porquê" tips, "Em resumo"), plus guides on AI costs and budget,
  checking the site version and what to do when something goes wrong; steps can be ticked off
  with a progress bar, guides can be copied as a link or printed cleanly, screenshots zoom,
  videos start on tap; search tolerates accents, plurals and typos and suggests words and a
  contact when nothing matches; an unknown guide link shows a friendly notice

### Fixed

- The backoffice list cards use a correct heading level, and the empty Inscrições tab names the
  option as it reads ("Aceitar inscrições pelo site")

## [2.18.1] - 2026-10-04

### Fixed

- **Footer on phones**: one consistent centred layout (links, contacts and the legal lines),
  the legal block in three tidy lines in the body font instead of a cramped monospaced run,
  room below for the floating assistant button so nothing hides under it; one line on desktop
- The organs on the Team page fit on a phone as equal segments instead of wrapping inside the
  pill or being cut off; the About buttons share one width on phones
- Home on phones: the impact cards grow with their text instead of leaving a hole (and no
  longer clip "Explorar"), sections use phone-sized spacing, long partner names take two lines
- The "Comece por aqui" row on /ajuda snaps card by card without a visible scrollbar
- IIS serves `.html` as UTF-8, so static pages next to the portal (an instance's brand guide)
  never show broken accents

## [2.18.0] - 2026-10-04

### Added

- **Up-to-date badge in the footer**: next to "Community Platform vX by BolaLabs" each site says
  "atualizada" or "vY disponível" (linking to the release notes), so anyone looking at an instance
  knows at a glance whether it runs the latest release. The backoffice Plataforma card shows the
  latest release too, with a note to ask for the update. The Convex backend reads the newest
  release from the repository in package.json every 6 hours (the releases page redirect, which,
  unlike GitHub's anonymous API, is not rate limited on Convex's shared IPs)

## [2.17.0] - 2026-10-04

The board learns the site from the site itself, and AI spending is cheap by default and visible
to whoever uses it.

### Changed

- **NanoBanana (Gemini) is the default image engine again** whenever a Gemini key exists
  (~0.07 $ and ~10 s per poster against ~0.23 $ and ~2 min for GPT Image 2); GPT Image is the
  default only when OpenRouter is the sole engine with a key, and stays available as "qualidade
  máxima" in Assistente virtual › Motor de imagem

### Added

- Every AI call records its cost: the real price reported by OpenRouter, or an estimate from
  Gemini's token counts and the published price table (2026-10-04)
- "Utilização e custos" in Assistente virtual: cost, requests, success rate and average time
  for 7 days, 30 days or this month, daily chart, cost by feature and by model, and the latest
  requests with who asked, the model, duration, cost and a plain failure reason
- Optional monthly AI budget with a progress bar; past it, the AI studio and "Gerar com IA"
  show a non-blocking warning
- The AI studio and "Gerar com IA" show the estimated cost before generating and the real
  cost afterwards; the backoffice home shows "IA este mês"
- **Help center**: an "Ajuda" tab in the backoffice with 25 step-by-step guides (search, short
  silent videos and screenshots, "Ir para…" buttons), a "Como funciona" button on every tab that
  opens that tab's guides, and deep links (`/admin?ajuda=<id>`); a public `/ajuda` page with 8
  guides for members and visitors (registering for an event, member area, quotas, passwords),
  linked from the footer and the member area. Content lives in `content/help` and is written
  for any association (`{siteName}`)

### Fixed

- When Gemini direct has no image quota (a free key), the fallback is NanoBanana through
  OpenRouter at the same price, not GPT Image, and the admin is not warned about a non-event
- `.webm` is served by IIS (help videos)
- The quota badges in the member area ("Em dia", "Por regularizar") reach AA in the light theme;
  the backoffice sidebar and empty states use a correct heading order

## [2.16.0] - 2026-10-04

### Changed

- **GPT Image is the default poster engine** whenever an OpenRouter key is configured (the
  engine behind ChatGPT's images: print-quality posters with exact Portuguese text); Gemini
  stays the automatic fallback and the default without an OpenRouter key. An admin choice in
  Assistente virtual › Motor de imagem still wins
- Posters carry the association's real name as a discreet footer line and may no longer
  invent organiser names, crests or slogans
- Model choices show their measured trade-off (GPT Image 2 ~2 min and ~0.23 $ per poster,
  Mini ~50 s and ~0.04 $, NanoBanana ~10 s), and the studio tells how long the chosen engine
  takes while it draws

### Added

- The OpenRouter balance in Motor de imagem, with how many GPT posters it still pays for and
  a warning below 5 $
- When the fallback engine is used, the note says why: no OpenRouter balance (and where to top
  it up), a rate limit or a timeout

### Fixed

- A slow GPT Image poster (~2 min) no longer risks the 150 s image timeout

## [2.15.2] - 2026-10-04

### Fixed

- `npm run dist` refuses a `.env.production` where a `VITE_*` value starts with an unquoted
  `#`: the .env format reads it as a comment, so `VITE_BRAND_COLOR=#df3d32` built as empty and
  the site fell back to the platform colour. The example and the white-label guide quote it

## [2.15.0] - 2026-10-04

Creating content, giving access and dressing the portal in an association's brand become
things anyone on the board can do from the backoffice, without help.

### Added

- **AI studio for events and news.** "Criar com IA" turns a sentence ("torneio de sueca no
  sábado às 15h, 5 € por dupla") into a filled form: title, text, date (relative days
  resolved), place, category, tournament and registration questions, plus a finished poster.
  Give it last year's poster and it reads it, keeps the look and updates the edition, date
  and details. Nothing is published until the form is saved; the poster arrives optimised
- **Image engine choice**: NanoBanana (Gemini) or an OpenRouter image model such as GPT
  Image 2, the engine behind ChatGPT's images, with automatic fallback to the other; the
  image tool can use the current picture as reference
- **Acessos tab**: give someone access by email (administrator or member) with a temporary
  password shown once and a ready-to-send message; change the role, issue a new password,
  remove an account. The last administrator and one's own access are protected
- **Change password** for everyone, in the member area and the backoffice sidebar
- **Dynamic brand**: colour (the full scale is derived and kept WCAG AA, even for light
  colours like yellow), heading and body fonts from a curated Google Fonts list, and a
  "Marca e imprensa" link to the instance's brand guide or media kit, all in Definições ›
  Marca with a live light/dark preview
- `access:grantFromCli` for operators when nobody can sign in

### Changed

- The platform's own default brand is a neutral indigo with neutral icons; a client's colour,
  logos and guide live only in its instance (DB settings, `VITE_BRAND_*`, brand overlay)
- Emails are stored lower-case, so capitalisation no longer creates a second account
- Every dialog renders at the document root, so one opened inside an animated section can no
  longer end up under the page and lose its clicks
- A failed AI image generation says so instead of returning a stock photo

### Removed

- `lib/bootstrapAdmin:setUserRole`, replaced by the Acessos tab and `access:grantFromCli`

## [2.14.1] - 2026-09-30

### Fixed

- The "Realizado" label on past events was light grey on a translucent black over the grey
  photo (3.9:1); it is now white on a darker backing. Found by the axe sweep of the live
  site, where the agenda lists past events because nothing is scheduled

## [2.14.0] - 2026-09-30

A full audit of the backend, the backoffice and the public portal, with every finding fixed
and checked in the running app: the public routes pass on phone and desktop with no console
errors, broken images or overflow, axe reports no WCAG 2 AA violation in either theme, and
every backoffice tab opens clean.

### Fixed

- **Backoffice saves that did not save.** Editing a highlighted number changed nothing, and
  renaming a partnership level created a second one; both now edit the record in place. A
  new number with only label and value no longer fails, and a duplicate label or name is
  refused with a clear message instead of a false "created"
- Generating an image with AI made the save of events, news, members, partners and
  milestones fail; the image now lands only on the form that asked for it, and a failed
  generation says so instead of saving a stock photo as generated
- "Melhorar com IA" reads and rewrites the text the form actually shows (the long
  description of an action area had no visible effect)
- An event's seat limit can be removed again; a news item's summary follows its edited
  content; an empty author reads "Direção" as promised; an action area saves without a long
  description; features ignore blank lines; an order of 0 is kept
- Confirming or cancelling a registration from its detail reports a failure instead of a
  false success; errors from the gallery, registrations and member quotas reach the admin in
  plain Portuguese, and a redacted "Server Error" no longer shows raw
- Duplicating the same event or news twice no longer fails on the slug
- A record still pointing to a deleted category shows that in the select instead of
  pretending the first category is chosen
- Settings refuse an empty site name or an invalid contact email before saving, and long
  fields stop at the length the server accepts
- **Public portal.** Going back from a registration and opening another event showed
  "Inscrição recebida" for an event nobody signed up to. The sign-in form kept email and
  password after closing, a risk on a shared computer; it now clears
- Inactive partners no longer appear in the home page carousel
- The agenda opens the chosen event; maintenance mode no longer locks the admin out;
  the Team page opens on the first existing body when there is no "Direção"
- A crashed page reports to Sentry, recovers when you navigate away, and reloads once
  when a deploy made its code chunk disappear
- Event times are compared in local time everywhere, so an event later today is upcoming
  on every page and registrations close at the venue's time, not an hour off in summer
- News cards, recommendations and the logo are real links (keyboard, new tab, crawlers);
  the closed mobile menu leaves the tab order and closes with Escape; the hidden navbar
  returns on keyboard focus; the partner carousel's copy is hidden from screen readers
- Light-theme contrast and focus rings across About, Member area, Blog, agenda, chat and
  partnership dialogs; the chat traps focus; the member area tabs are real tabs
- Each page declares its own canonical URL and Open Graph title instead of the home's
- The download button of member documents shows on phones; links typed without https work
- Text-to-speech, clipboard, calendar and deleted-album failures say so instead of failing
  silently; audio resumes on iOS
- Gallery photos are resized in the browser before upload, like every other image
- **Backend.** The guest-registration purge could stall and stop the 90/30-day deletion;
  it now pages through guests only. The setup gate, the album list and the photo counts read
  by index instead of whole tables
- Updates of events, news, notifications, settings and partnership requests validate like
  their creates; re-confirming a cancelled registration respects the seat limit
- Shared links of events whose image is a relative path now carry an absolute og:image
- Running the demo seed on a real instance aborts unless forced, and never wipes the team
  without its photos

### Changed

- Avatars without a photo are drawn locally from the initials; no name is sent to a
  third-party avatar service. Image fallbacks are local, not hotlinked from Unsplash
- The privacy notice lists every third party the portal actually uses
- `sponsors.list` returns active partners; the backoffice uses the new `sponsors.listAll`
- AI usage logs are kept 90 days; the log, rate-limit and upload sweeps catch up when
  behind

### Removed

- `albums.list` and `maintenance.safeCleanup`, unused; the latter deleted duplicates
  without cascade or storage cleanup

## [2.13.5] - 2026-09-30

### Fixed

- **Replaced images no longer pile up in storage.** Photos uploaded or generated in the
  backoffice reach the records as links, so nothing knew which stored file a link was and every
  replaced or deleted image stayed in Convex storage for good. A ledger of uploads now counts
  the records that use each file: replacing, removing or deleting releases it, and the file goes
  with its last user, so a duplicated record keeps its picture. The home page photo in the
  settings is counted the same way
- The duplicate button in the backoffice lists said only "Duplicar" to screen readers; it now
  names the record, like Editar and Apagar

### Added

- A daily job removes uploads nobody saved within 48 hours (a form closed without saving, a
  second pick before saving)

### Removed

- `members.clearAll`, an unused admin mutation that deleted the whole team and left its photos
  behind

## [2.13.4] - 2026-09-30

### Fixed

- **Changing an image in the backoffice now always shows.** A record whose picture lived in
  Convex storage kept showing the old one after a new photo was chosen: the save went through
  and said so, but the read side prefers the stored file over the new link. Every update with
  an image (team members, events, news, milestones, partners, action areas, album covers)
  now releases the stored file on the server when a new link or a removal arrives, and the
  file no longer lingers in storage
- A cover set in an album's form now shows even when a photo had been picked as cover in the
  photo manager
- Editing a document's link was ignored when the document already had one; the new link is
  saved, and a replaced upload is deleted from storage
- Duplicating a record no longer shares the original's stored image, so replacing the
  picture of one of them cannot delete the other's

### Removed

- The `clearStorageImage` mutations of albums, events, members and posts; removing an image
  is part of `update`

## [2.13.3] - 2026-09-30

### Fixed

- The home agenda showed the eight upcoming events furthest away instead of the next eight:
  events arrive newest first and the carousel did not re-sort them
- With nothing scheduled, the home agenda showed past events under "Próximos eventos"; it now
  says "Os últimos eventos"
- The home news block no longer shows "Sem notícias de momento" to visitors; it appears with
  the first published article

## [2.13.2] - 2026-09-26

### Added

- **The version in plain sight**: the footer credit reads "Community Platform v2.13.2 by
  BolaLabs", and says "(servidor v…)" when the Convex backend runs another release
- A public `platform:version` query reports the version the Convex backend was deployed from;
  the backoffice Plataforma card shows it next to the site's, and warns when they differ
- The instance template's daily health check fails when Convex and `platform.lock` disagree

### Fixed

- The footer's copyright line was slate-600 on the dark background

## [2.13.1] - 2026-09-26

### Fixed

- Past events in the Arquivo were drawn at 80% opacity, which took every line on the card
  below WCAG AA; the grey photo and the "Realizado" label already mark them as past
- The count on the active agenda filter was white on a light tint of the brand red

## [2.13.0] - 2026-09-26

A portal every visitor can read and a repository fit to be shown. An automated sweep of every
public route (phone and desktop, light and dark: console errors, broken images, horizontal
overflow and axe WCAG 2 AA) ends with no findings, and the registration and publishing flows
pass end to end on the demo association.

### Added

- **Home page photo from the settings** (Definições › Identidade & Textos), uploaded and
  optimised in the browser like any poster. Without one, the hero is the brand colour alone
- README screenshots of registration without an account and of the Inscrições tab

### Changed

- **WCAG AA contrast across the portal and the backoffice.** White text on the brand red uses
  the 700 shade (the 600 base gave 4.3:1), and so does red text on light surfaces; secondary
  grey is one step stronger in each theme; amber labels (Reservado, Torneio, Sócio Fundador)
  read in the light theme; partner captions keep their contrast on the white logo chip
- Category labels with white text use the 700 shade of their hue; the dots keep the 500
- Capacity bars have an accessible name; the decorative years on the History timeline are
  drawn by CSS, so screen readers skip them
- The demo seed's registration forms no longer repeat name, email and phone, which every
  form already asks, and the Sueca tournament shows a card game
- LICENSE: the code belongs to BolaLabs; ARCVA is a partner and reference client, not a
  copyright holder. The public contact is bruno@bolalabs.pt

### Fixed

- The home hero loaded a hard-coded Unsplash photo that had been withdrawn, and the gallery
  tile a third-party texture; the portal ships no external image in code
- A badge painted light red text on a red fill in the dark theme when its caller chose the fill
- The Início card "Por tratar" spilled out of its box with several pending registrations; it
  scrolls now. Enter on a pending registration opened it twice

### Security

- The public history was rewritten to start at the first generic commit: a client's real
  photographs, partner logos and names from the pre-release commits are gone from the branch
  and every tag. Release assets were already clean

## [2.12.1] - 2026-09-26

### Fixed

- Link previews in a production build could point crawlers at the development deployment.
  `npx convex dev` writes the dev deployment's `VITE_CONVEX_SITE_URL` into `.env.local`,
  which Vite loads in every mode, and the preview rule trusted it before the production
  `VITE_CONVEX_URL`. The origin is now derived from the deployment the bundle talks to, and
  `npm run dist` refuses a package whose preview rule names another deployment. Found by
  checking the reference instance in production right after the 2.12.0 deploy; people were
  never affected, only crawler previews

## [2.12.0] - 2026-09-26

Registrations people actually complete, and a board that stays in control of them. Reviewed
by a panel (UX for volunteer boards, security and GDPR, accessibility, white-label and
operations) and validated end to end in the browser.

### Added

- **Registration without an account**, the default for every event, including events created
  before this release: name, email, optional phone and the event's own questions. The board
  can restrict an event to members with an account. Guests are limited per email (hashed),
  per session and globally, a honeypot catches form bots, an event holds at most 40
  unconfirmed guest registrations, and every one waits as "pending" for the board
- **An Inscrições tab**: a count of pending registrations in the menu; per event, totals by
  state and a capacity bar; confirm all pending at once; confirm, cancel or reactivate per row
  with words, not icons; a list for the door to print (name, phone, answers, a box to tick);
  an Excel export with the event's own questions as columns; copy every email for a Bcc
- The registration detail offers email and WhatsApp to the person, and says plainly that
  confirming does not notify anyone
- A privacy notice at `/privacidade`, written from each instance's settings: controller,
  purposes and legal basis, retention, processors, rights and the supervisory authority. The
  registration form links to it; guest registrations record when the notice was shown
- Registrations without an account are deleted 90 days after their event, cancelled ones
  after 30 days (daily cron)
- The instance template ships `health.yml` (daily outside check: certificate for every host,
  served version, link previews) and `backup.yml` (weekly export **with file storage** to the
  server disk, 8 weeks kept, never in git)
- Link previews without Application Request Routing: `VITE_SHARE_PREVIEWS=redirect` sends
  preview crawlers to the Convex page with a 302, which needs only URL Rewrite

### Changed

- The event form groups registrations in one block and names things the way a board says
  them: "Aceitar inscrições pelo site", "Lugares disponíveis" (empty means no limit), "Preço
  por pessoa (€)", "Mostrar em destaque na página inicial", "É um torneio" with a free-text
  "Modalidade" and suggestions instead of one region's fixed list of games
- The registration questions builder says the form already asks name, email and phone, and
  its types read "Texto curto", "Texto longo", "Número"
- The news form puts the article under its title; author, reading time and keywords fold
  under "Mais opções"; the author avatar URL field is gone
- The backoffice menu and pages use plain names: Início, Página inicial, Mensagens recebidas,
  Avisos aos sócios, Assistente virtual; the activity list shows dates and Criado/Alterado/
  Apagado; pending registrations on the dashboard name their event
- The event dialog shows the time, "Restam N lugares" for every event with a limit, and a
  clear "Esgotado" state; the agenda card offers "Ver e inscrever-me" and one "Adicionar ao
  calendário"
- The registration screen after sending repeats what, when, where and the price, and tells
  people how to back out; the calendar file now carries the UID and DTSTAMP Outlook requires
- Primary buttons and the WhatsApp button use darker shades so white text meets WCAG AA

### Fixed

- "Esgotado" was only shown for tournaments; any event with a limit now shows it before the
  server refuses
- The screen after registering said "A sua presença foi confirmada" while the registration
  was pending
- An event with its own questions stopped asking for name and email, then refused the
  registration for lacking an email nobody could type
- The participant counter was nudged up and down and could drift; it is recomputed
- A cancelled registration let the same email register again and again
- Answers to questions an event never asked were stored; required answers are now enforced
  on the server as well
- The full-screen poster opened inside the event dialog's box, and Escape closed both
- Focus: forms open on their first field, errors take focus to the first problem, the result
  screen takes focus from the vanished send button, and dialogs keep Tab inside
- Site backups in the instance template pruned every folder in `C:\inetpub\backups`,
  including another instance's; they are now scoped to the site folder
- Editing a media kit kept under `brand/kit` no longer triggers a deploy
- Client-specific names left in tests and docs replaced with the fictional demo

## [2.11.1] - 2026-09-26

### Security

- The link-preview page no longer falls back to the request's `Host` or `X-Forwarded-Host`
  header when `SITE_URL` is unset. Both are chosen by the caller, so the canonical URL and the
  redirect of a publicly cached page could be pointed at another domain. Without `SITE_URL`
  the page now answers 503 and describes nothing. Deployments with `SITE_URL` set, as every
  documented one is, were not affected

## [2.11.0] - 2026-09-26

Publishing and sharing, validated end to end as an association would use it: create an
event with a poster, highlight it, open registrations, publish, and send it to WhatsApp.

### Added

- Every event has its own address (`/events/<slug>`). A shared link opens that event; the
  browser's Back button closes it instead of leaving the agenda
- A share bar on events and articles: WhatsApp first, Facebook, copy link, and the phone's
  share sheet where one exists. Plain links — no SDK, no tracking, no CSP exception. The
  WhatsApp message carries what, when and where, with the link on its own line
- Link previews per event and article: Convex serves a page with the item's own title, date,
  place, excerpt and poster at `/share/events/<slug>` and `/share/blog/<slug>`. Instances
  whose web server can proxy crawler requests there (IIS with ARR, or nginx) get the poster in
  the WhatsApp and Facebook card; `VITE_SHARE_PREVIEWS=proxy` makes the build add the IIS
  rule. See `docs/SHARING.md`
- A visual text editor is now the default in the backoffice: type, Enter for a new paragraph,
  bold, headings, lists, links. Pasted text from WhatsApp or Word arrives clean. The HTML
  field it replaces as default showed tags, and text typed into it lost its line breaks on
  the site because a newline is not a paragraph in HTML; it stays one click away

### Changed

- Posters are shown whole in the event dialog, over a blurred copy of themselves, and open
  full screen. A cover crop cut off the date and details printed at the top and bottom
- Images are optimised in the browser before upload: long edge capped at 2000 px, phone
  rotation applied, photos re-encoded as JPEG, logos with transparency kept as PNG. A 4.2 MB
  poster lands at 156 KB, and the backoffice says so after the upload
- The image field opens on upload rather than AI generation, is named for what it holds
  ("Cartaz ou imagem", "Imagem de capa"), accepts drag and drop, and previews a portrait
  poster whole. It no longer loads a background texture from a third-party site
- A new article starts dated now; the date was required but empty, so saving failed until
  someone noticed the field
- An article whose lead is only the opening of its body no longer shows the same sentence
  twice
- A dialog that only shows content focuses itself when it opens instead of its first link or
  image, which drew a focus ring around content nobody chose; forms still land on their
  first field

## [2.10.0] - 2026-09-09

### Added

- Optional error monitoring per instance: set `VITE_SENTRY_DSN` and the portal reports
  uncaught errors, with the platform version as the Sentry release. With no DSN the SDK is
  never downloaded, so an instance without monitoring pays nothing for the feature and sends
  nothing anywhere. PII is off, the user object is dropped and query strings are stripped
  before an event leaves the browser
- A test suite for the logic that fails quietly (`npm test`, Vitest, 42 tests): token bucket
  arithmetic, excerpt truncation, the generated CSP, text helpers, the `ERR_*` provider
  tokens and the release guard. Rendering and database behaviour are still verified by
  running the app, not by mocking Convex
- The admin dashboard shows the platform version this browser is running next to the one the
  server is serving, and offers a reload when a deploy happened while the tab was open

### Changed

- The `web.config` Content-Security-Policy header is generated from the built HTML instead
  of being maintained by hand. The inline theme script's hash lives in two places — the meta
  tag and the response header — and a stale copy blocks the script in production while every
  local check passes; they cannot drift now
- The rate limiter's arithmetic moved to `convex/lib/tokenBucket.ts` and the excerpt helper
  to `convex/lib/text.ts`, so both are exercised directly by tests instead of through a
  mutation

## [2.9.1] - 2026-09-09

Release and deploy integrity: what a release claims, what the artifact contains and what a
server ends up serving are now checked against each other instead of assumed equal.

### Added

- Releases carry a `.sha256` next to the zip and a signed build-provenance attestation, so a
  download can be verified before it is installed on a server
  (`gh attestation verify community-platform-dist.zip --repo <owner>/<repo>`)
- `scripts/release-prepare.mjs` runs before the release build and refuses a tag that
  disagrees with `package.json` — which would publish a zip whose `version.json` contradicts
  the release page — or a version with no `CHANGELOG.md` section. The section becomes the
  release notes, with the commit list appended
- The instance deploy smoke test reads `/version.json` back from the live site and compares
  its `builtAt` with the package it just installed. A deploy that never landed (a partial
  copy, a cached response) now rolls back instead of reporting success

### Changed

- The instance template checks out with `actions/checkout@v7`; v4 forced the runner onto a
  deprecated Node and warned on every deploy

## [2.9.0] - 2026-09-09

### Added

- Every build publishes the platform version it was made from: `/version.json`
  (`{platform, version, builtAt}`) for checking a fleet of instances without parsing HTML,
  and a `generator` meta tag for whoever opens the page. The portal footer carries the same
  version as the tooltip of the "Community Platform by BolaLabs" line, and `npm run dist`
  refuses a package whose HTML does not carry the version it just built

### Removed

- The admin settings form asked for a Facebook access token that no query has ever read —
  the footer link is built from `facebookPageId` alone. The field, its mutation argument and
  its presence flag are gone; the schema keeps the column, deprecated, so documents written
  before this release stay valid, and a stored value can be cleared from the Convex
  dashboard. A Graph feed that would use it is on the roadmap

### Changed

- The public news list reads the `by_published` index instead of taking the 200 most recent
  posts and filtering drafts out in JavaScript. The index already existed; the query never
  used it, so a portal with many drafts served fewer than 200 published posts

### Fixed

- `SECURITY.md` still promised that chat classification fails open, which 2.8.0 inverted;
  the entry now states that a turn is refused when no verdict can be produced, and what that
  costs a deployment whose only provider is unreachable
- The roadmap listed the automated backend deploy as pending; the instance template ships it
  and a reference deployment runs it

## [2.8.0] - 2026-09-09

Reliability pass on the rate limiter, the chat guardrail and the public event
subscription, verified against a development deployment.

### Fixed

- The rate limiter stamped the refill clock on every accepted request, so the
  fraction of a token earned since the previous call was thrown away: once a bucket
  drained, a caller was credited only when a gap longer than a whole refill interval
  appeared, which made the burst allowance usable exactly once. Twenty-four chat
  requests spaced five seconds apart, against a budget that allows twenty-nine, lost
  eight to a spurious "limite de pedidos atingido". The clock now advances only by
  the time the credited tokens cost

### Changed

- The guardrail classifier fails closed. With no verdict there is no way to tell an
  injection attempt from an ordinary question, so the assistant refuses the turn
  instead of forwarding an unchecked message to the model. Classification first
  walks the same fallback that the chat itself uses and lands on Gemini, so a
  throttled or retired slug on the configured provider does not mute a chat the
  fallback chain can still answer
- The public event list ships a plain-text excerpt instead of the rich-text body
  (`events.listSummary`), the way the news list already did; the detail modal loads
  the description of the open event through `events.getById` and shows the excerpt
  while it arrives. Event search, calendar exports and structured data read the
  excerpt, so searching matches the first 300 characters of a body rather than all
  of it

## [2.7.4] - 2026-09-08

Data-integrity and performance review of the backoffice, verified end to end on the demo
instance (16 flows, including a public registration on an event created from the backoffice).

### Fixed

- Events saved from the backoffice got `maxParticipants: 0`, which the registration
  mutation read as "sold out": nobody could register in an event created or edited from
  the form. Zero or empty now means no limit, on both sides
- The event form showed price and capacity as 0 regardless of the stored value
- Saving an event sent back the `currentParticipants` snapshot taken when the modal
  opened, undoing registrations made meanwhile; server-owned counters no longer travel
- MB WAY, IBAN and Multibanco fields were blank in the backoffice since 2.6.0 moved them
  out of the public settings query; the admin overlay carries them again
- Removing an image in the Media Studio cleared the URL but left the stored file, which
  the portal kept showing (events, news, team, album covers)
- Editing an uploaded document turned it into an external link to its own storage URL
- Category rename could produce duplicate slugs; category delete missed content that
  referenced it by slug or name
- Replacing an album's photos could leave its cover pointing at a deleted photo
- Registration form prefills and locks the signed-in member's email instead of
  rejecting a different one after submit; checkbox options in the event form are real
  labels

### Changed

- Home carousel shows the next eight events instead of every event as an image card
- Cleanup crons range over an index instead of scanning the whole table; public team and
  partner lists are bounded
- `ROADMAP.md` lists the planned work, including the lighter public subscriptions

## [2.7.3] - 2026-09-08

Backoffice validation sweep on a clean demo instance (16 tabs on desktop and mobile, CRUD
and draft/publish flows, realtime sync with the public portal, settings, quotas): no
console errors, no horizontal overflow, 14/14 flows passing.

### Fixed

- A required field reported by the server used its schema key (`"description"`); the
  message now uses the form label, and the event form marks description and location as
  required
- The demo seed had no history milestones, so a fresh install opened the History tab empty

## [2.7.2] - 2026-09-08

### Fixed

- The instance build on a Windows runner checked `index.html` out with CRLF, so the inline
  theme script no longer matched the LF hash in the `web.config` header and browsers blocked
  it; the build now emits LF regardless of the checkout, and `.gitattributes` pins the EOL
- The events list puts what is next first and the archive after it, newest first

## [2.7.1] - 2026-09-08

### Fixed

- The CSP meta tag hashed the inline theme script before Vite re-indented it, so browsers
  blocked the script and logged a violation on every page load (the header was right, the
  meta was not); the hash is now taken from the HTML that is actually emitted, and
  `frame-ancestors` stays in the header only, where browsers honour it
- Events opens on the full list when nothing is scheduled yet, instead of an empty
  "upcoming" tab

## [2.7.0] - 2026-09-08

Demo that stands on its own, and a fresh clone that actually starts.

### Added

- Optional name at sign-up (member registration and the `/setup` wizard); the member
  card and the backoffice greeting use it instead of the email prefix
- Demo seed: three gallery albums, per-event registration forms on three events, and
  event dates relative to the day the seed runs, so a new install opens on a live agenda
  instead of an empty "upcoming" list

### Fixed

- `npx convex dev` failed on a fresh clone: four files did not pass the strict typecheck
  Convex runs before pushing (implicit `any` through the `chat` action, `undefined`
  index arguments, a widened seed status)
- `/setup` showed the raw request id when the deployment had no auth variables; it now
  says what is missing
- Docs told operators to pass `--allow-dirty-git-state` to the auth CLI; the flag does
  not exist

### Changed

- README, AGENTS.md and the docs speak about Community Platform as the product; ARCVA is
  named only as the founding partner and the reference instance, and every screenshot
  comes from the fictitious demo association

## [2.6.1] - 2026-09-06

### Changed

- `context/DataContext.tsx` (1676 lines) split into `context/data/`: document and
  argument types, helpers, and one `use<Entity>Actions` hook per domain; the provider
  keeps queries, mapping and the memoised value (414 lines)
- `convex/ai.ts` (927 lines) split: chat stays in `ai.ts`, TTS and image generation in
  `aiMedia.ts`, geo and text enhancement in `aiText.ts`, shared helpers in
  `lib/aiShared.ts` — client references moved to `api.aiMedia.*` / `api.aiText.*`
- Anonymous visitors now send a per-browser `sessionId` (`utils/session.ts`) with chat,
  TTS and geo calls, so the per-session bucket introduced in 2.6.0 is actually used

### Security

- `documents.list` returns nothing to anonymous callers and the client no longer
  subscribes to it without a session: the members' archive was world-readable

## [2.6.0] - 2026-09-06

Five-front audit (public UX, backoffice, code, docs/SEO, security) consolidated into one
release.

### Security

- `ai.chat` no longer accepts a `model` argument from the client; anonymous AI traffic
  gets a per-browser session bucket plus a global ceiling instead of one shared bucket
  that any visitor could drain; `enableChatbot` is enforced server-side; chat input is
  capped at 2000 chars and TTS at 1500
- Contact and partnership forms add a global rate-limit bucket, since the per-email
  bucket was keyed on attacker-supplied input
- Quota payment details (IBAN, MB WAY, Multibanco) moved out of `settings.getPublic`
  into `settings.getPaymentDetails` (requires a session)
- Password policy: 10+ characters with upper, lower and digit; the admin login dialog no
  longer offers sign-up
- Content-Security-Policy generated at build with the inline theme script allowed by hash
  (no `'unsafe-inline'` for scripts), plus `object-src`, `base-uri`, `form-action`,
  `frame-ancestors`; mirrored as an IIS header; HSTS `preload`
- `sanitizeUrl` now guards every database- or model-supplied `href` (chat links, grounding
  sources, documents, partner websites, footer)
- Build-time `%VITE_*%` values are HTML-escaped; deploy workflow passes repository
  variables through `env:` instead of the command line
- Real instance content (`convex/migrations.ts`) left the public repository

### Fixed

- Editing an album's title or description wiped all its photos: the edit form carried the
  query's empty `photos` array back into the update, which `setImages` honoured
- Saving any settings section blanked the AI system prompt extra (it was missing from the
  admin overlay); same fix for the Facebook token flag
- Untouched images were re-saved as external URLs on every edit
- Tier delete guard compared against the tier name while sponsors store the id
- Registrations list returned the 500 oldest rows instead of the newest
- "Iniciar sessão para inscrever" reloaded the home page; it now opens the login dialog
  in place. The home page's "Inscrever-me" opens the event on the events page
- Article page showed "not found" while still loading, with no way back
- Light-theme contrast on error text (`text-red-400` without a light pair)
- Category deletion and stats upsert use indexes instead of table scans; notifications,
  contacts, sponsorship requests and the gallery summary are bounded queries

### Added

- `Field` component: every backoffice label is linked to its control, required fields
  are marked, hints are announced (82 label/input pairs converted)
- Organization JSON-LD on the home page, Event JSON-LD on the events page, per-article
  Open Graph/Twitter tags and canonical on news articles
- PNG icons (192/512/maskable) and `apple-touch-icon`
- Sócios & Quotas on the shared `EntityList` (search, quota-state filters, sort, mobile
  cards); empty states for the member area's documents and notifications and for the
  dashboard activity log; gallery album skeleton
- One Gemini model catalogue (`GEMINI_*_MODELS`) feeding the admin selects, Media Studio
  and the provider test tool
- `SECURITY.md` "Known limitations" section

### Changed

- Public accent colour is the brand gold instead of purple (headings, glows, hover
  borders); notification "info" tone uses the brand instead of blue
- Shared `normalize`/`slugify`/`progressWidthClass` helpers replace four copies; the
  last inline `style={{}}` and the `any` casts in seeds are gone
- README model and rate-limit tables match the code; `VITE_INSTAGRAM_URL` documented in
  the env examples; setup scripts carry the product name

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

[Unreleased]: https://github.com/brunobola-portfolio/community-platform/compare/v2.13.3...HEAD
[2.13.3]: https://github.com/brunobola-portfolio/community-platform/compare/v2.13.2...v2.13.3
[2.13.2]: https://github.com/brunobola-portfolio/community-platform/compare/v2.13.1...v2.13.2
[2.13.1]: https://github.com/brunobola-portfolio/community-platform/compare/v2.13.0...v2.13.1
[2.13.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.12.1...v2.13.0
[2.12.1]: https://github.com/brunobola-portfolio/community-platform/compare/v2.12.0...v2.12.1
[2.12.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.11.1...v2.12.0
[2.11.1]: https://github.com/brunobola-portfolio/community-platform/compare/v2.11.0...v2.11.1
[2.11.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.10.0...v2.11.0
[2.10.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.9.1...v2.10.0
[2.9.1]: https://github.com/brunobola-portfolio/community-platform/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.8.0...v2.9.0
[2.8.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.7.4...v2.8.0
[2.7.4]: https://github.com/brunobola-portfolio/community-platform/compare/v2.7.3...v2.7.4
[2.7.3]: https://github.com/brunobola-portfolio/community-platform/compare/v2.7.2...v2.7.3
[2.7.2]: https://github.com/brunobola-portfolio/community-platform/compare/v2.7.1...v2.7.2
[2.7.1]: https://github.com/brunobola-portfolio/community-platform/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.6.1...v2.7.0
[2.6.1]: https://github.com/brunobola-portfolio/community-platform/compare/v2.6.0...v2.6.1
[2.6.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/brunobola-portfolio/community-platform/compare/v2.0.0...v2.2.0
[2.0.0]: https://github.com/brunobola-portfolio/community-platform/releases/tag/v2.0.0
