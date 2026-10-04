# White-Label — Lançar o portal de uma organização

Serve associações, comunidades e instituições — associações culturais e recreativas, clubes
desportivos, juntas de freguesia, IPSS e outras instituições locais.

O repositório é um produto genérico: nenhum ficheiro versionado nomeia uma organização real.
O conteúdo demo (seed) é uma associação fictícia, "ACR Vila Nova". Tudo o que identifica
uma instância real vive em **três camadas privadas**, nunca no git:

| Camada | Onde | O que contém | Quem a lê |
|--------|------|--------------|-----------|
| **1. Base de dados** (a que manda) | Convex — Admin > Definições e restantes tabs | Identidade, textos, contactos, IA, eventos, equipa, história, galerias, documentos | Todo o portal, em tempo real |
| **2. Ambiente** | `.env.production` / `.env.local` (gitignored) | `VITE_*`: meta tags do `index.html` (título, OG, canonical, URL do site) e fallbacks para o primeiro render | `vite build` / `npm run dev` |
| **3. Overlay de marca** | `.brand/public/` (gitignored) | `logo.svg`, `favicon.svg`, `og-image.png`, `manifest.json`, `images/**` (fotos de equipa, cartazes, logos de parceiros) | `npm run dist` copia para `dist/`; em dev o Vite serve-a à frente de `public/` |

Se a camada 2 ou 3 faltar, o build continua a funcionar com os assets e textos genéricos
do repositório — nunca há um build "partido", só um build sem marca.

**Padrão recomendado: um repositório privado de instância.** Em vez de um fork, cada
associação guarda as camadas 2 e 3 (mais backups e notas) num repo privado próprio, sem
código, com um `platform.lock` (tag da plataforma em produção) e um `apply.ps1` que
clona/atualiza a plataforma nessa versão, copia as camadas e corre `npm run dist`. Zero
divergência de código, zero risco de fuga, e "retomar noutro PC" é clonar os dois repos.
Template pronto em `templates/instance/`; playbook completo (Convex, servidor, runner,
rotina) em [docs/INSTANCE-REPO.md](INSTANCE-REPO.md).

## 1. Base de dados (sem código)

Depois do deploy ([DEPLOY.md](../DEPLOY.md) ou [DEPLOY-VPS.md](../DEPLOY-VPS.md)) e da conta
criada em `/setup`:

- **Admin > Definições > Identidade & Textos** — **fotografia de fundo da página inicial**
  (carregada ali mesmo; sem ela, o fundo é só a cor da marca), nome completo, localidade,
  concelho, ano de fundação, tagline e subtítulo do hero, nome e descrição da sede, introdução e citação da
  página História, nota dos sócios fundadores. Campos vazios escondem a secção respetiva.
- **Admin > Definições > Marca** — cor da marca, letra dos títulos e do texto, link para o
  guia de marca / media kit (ver secção 4).
- **Admin > Definições > Geral / Contacto** — nome curto, email, **URL do logótipo**
  (ex: `/logo.svg`, servido pelo overlay), telefone, horário, morada, Maps, coordenadas,
  redes sociais, missão e pilares, quotas e pagamentos.
- **Admin > IA & Chatbot** — fornecedor, modelos, guardrails, tópicos, prompt extra.
- **Admin > História / Membros (grupo `founder`) / Eventos / Notícias / Parceiros /
  Galeria / Homepage** — substituir o conteúdo demo (ou não correr `seed:seed` de todo).

Backup e repovoamento de uma instância: `npx convex export --prod --path backup.zip` e
`npx convex import --prod backup.zip` — o snapshot é o "seed" real da instância e guarda-se
fora do repositório.

## 2. Ambiente (`.env.production`)

Copiar de `.env.production.example` e preencher. As chaves de identidade que o
`index.html` e os defaults leem:

```
VITE_SITE_NAME, VITE_SITE_FULL_NAME, VITE_SITE_URL, VITE_SITE_DESCRIPTION,
VITE_SITE_KEYWORDS, VITE_OG_TAGLINE, VITE_LOGO_URL,
VITE_LOCALITY, VITE_REGION, VITE_FOUNDED_YEAR, VITE_HERO_TAGLINE, VITE_HERO_SUBTITLE,
VITE_VENUE_NAME, VITE_VENUE_DESCRIPTION, VITE_HISTORY_INTRO (parágrafos com \n\n),
VITE_HISTORY_QUOTE, VITE_FOUNDERS_NOTE, VITE_ABOUT_MISSION,
VITE_CONTACT_EMAIL, VITE_PHONE, VITE_ADDRESS, VITE_MAPS_URL, VITE_LATITUDE, VITE_LONGITUDE,
VITE_FACEBOOK_PAGE_ID, VITE_INSTAGRAM_URL, VITE_AI_ALLOWED_TOPICS,
VITE_BRAND_COLOR, VITE_FONT_HEADING, VITE_FONT_BODY, VITE_BRAND_GUIDE_URL
(a cor vai entre aspas, `VITE_BRAND_COLOR="#df3d32"`: sem aspas o `#` começa um comentário e o
valor fica vazio; o `npm run dist` recusa o build nesse caso)
```

O guia de marca de cada instância (ex.: `/marca/`, servido do overlay `brand/` do repositório
da instância) tem de ser uma página HTML completa: `<!doctype html>`, `<meta charset="utf-8">` e
`<meta name="viewport" content="width=device-width, initial-scale=1">`. Sem viewport o telemóvel
desenha-a à largura de desktop. O `web.config` da plataforma já envia `text/html; charset=utf-8`,
por isso os acentos ficam certos mesmo que falte o `<meta charset>`.

`VITE_SITE_URL` também gera `sitemap.xml` e `robots.txt` no `npm run dist`. No deployment
Convex (server-side): `GEMINI_API_KEY` (obrigatória para IA) e, opcionalmente,
`SITE_LATITUDE`/`SITE_LONGITUDE` para o geo-assistente e `SITE_PHONE` para a migração de
contactos.

## 3. Overlay de marca (`.brand/public/`)

Espelha a estrutura de `public/`. Ficheiros com o mesmo nome substituem os genéricos:

```
.brand/public/
├── logo.svg          # logótipo (referenciado por VITE_LOGO_URL / Definições)
├── favicon.svg
├── og-image.png      # 1200x630 para partilhas sociais
├── manifest.json     # PWA com o nome da associação
├── icons/            # apple-touch-icon.png, icon-192.png, icon-512*.png com o logótipo
├── marca/            # guia de marca / media kit servido em /marca/ (opcional)
└── images/           # fotos de equipa, cartazes, logos de parceiros (URLs /images/... na BD)
```

## 4. Marca: cor, tipografia e guia

Nada da marca vive no código. Em **Admin > Definições > Marca**:

| Campo | O que faz | Fallback (`VITE_*` → plataforma) |
|-------|-----------|----------------------------------|
| `brandColor` | Uma cor `#rrggbb`; a escala `brand-50…950` inteira é gerada a partir dela em runtime | `VITE_BRAND_COLOR` → `#4f46e5` (índigo) |
| `fontHeading` | Letra dos títulos (`font-serif`), de uma lista curada | `VITE_FONT_HEADING` → Playfair Display |
| `fontBody` | Letra do texto e da UI (`font-sans`), de uma lista curada | `VITE_FONT_BODY` → Geist |
| `brandGuideUrl` | Link «Marca e imprensa» no rodapé (escondido se vazio) | `VITE_BRAND_GUIDE_URL` → vazio |

- **Contraste garantido.** Uma cor clara (amarelo, ciano) é escurecida automaticamente nos
  tons que levam texto (botões, links), por isso qualquer escolha mantém AA. O painel mostra
  os rácios e avisa quando houve ajuste. Detalhes em [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md#marca-dinâmica).
- **Fontes só da lista** em [utils/brandFonts.ts](../utils/brandFonts.ts) (8 de títulos, 8 de
  texto, todas Google Fonts). O CSP já permite `fonts.googleapis.com`/`fonts.gstatic.com`;
  acrescentar uma família é uma entrada nessa lista com a query css2 exata.
- **Primeiro paint.** O `index.css` traz os valores da cor por omissão; o browser guarda a
  última marca vista, por isso quem volta já não vê o índigo antes das settings chegarem.
- **Guia de marca / media kit.** Os ficheiros (logótipos, PDF do guia, fotos para imprensa)
  são da associação: vivem no **repositório da instância** e são publicados pelo overlay
  (`.brand/public/marca/index.html`, `.brand/public/marca/logo.zip`, ...), servidos em
  `/marca/`. Nas settings fica só o caminho (`/marca/`) ou um link externo (Drive, site da
  associação), que abre noutro separador. Nunca commitar estes ficheiros neste repositório.
- Os ícones PWA (`public/icons/*.png`) e o `favicon.svg` do repositório são neutros; a
  instância substitui-os no overlay (`.brand/public/icons/`, `.brand/public/favicon.svg`).

## Regra para contribuidores

Identidade nova entra SEMPRE via `settings` (BD) ou `VITE_*` — nunca hardcoded em
componentes, prompts ou seeds. Se um campo ainda não existe, o caminho é
`convex/schema.ts` + `settings.getPublic`/`getForAI`/`update` + `seedHelpers.updateSettings`
+ `types.ts` + `utils/defaultSettings.ts` + Admin > Definições (`AdminIdentitySection`),
não outro literal no código. Conteúdo demo é fictício por definição: sem nomes de pessoas
reais, sem parceiros reais, sem fotos reais.
