# White-Label — Lançar o portal de uma associação

O repositório é um produto genérico: nenhum ficheiro versionado nomeia uma associação real.
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
divergência de código, zero risco de fuga, e "retomar noutro PC" é clonar os dois repos. A
instância de referência segue este padrão (`BolaLabs/arcva-instance`, privado).

## 1. Base de dados (sem código)

Depois do deploy ([DEPLOY.md](../DEPLOY.md) ou [DEPLOY-VPS.md](../DEPLOY-VPS.md)) e da conta
criada em `/setup`:

- **Admin > Definições > Identidade & Textos** — nome completo, localidade, concelho, ano de
  fundação, tagline e subtítulo do hero, nome e descrição da sede, introdução e citação da
  página História, nota dos sócios fundadores. Campos vazios escondem a secção respetiva.
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
VITE_FACEBOOK_PAGE_ID, VITE_INSTAGRAM_URL, VITE_AI_ALLOWED_TOPICS
```

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
└── images/           # fotos de equipa, cartazes, logos de parceiros (URLs /images/... na BD)
```

A cor da marca é o único ponto de branding que vive no código: a escala `brand` em
[tailwind.config.ts](../tailwind.config.ts) (instância de referência: vermelho `#df3d32`).

## Regra para contribuidores

Identidade nova entra SEMPRE via `settings` (BD) ou `VITE_*` — nunca hardcoded em
componentes, prompts ou seeds. Se um campo ainda não existe, o caminho é
`convex/schema.ts` + `settings.getPublic`/`getForAI`/`update` + `seedHelpers.updateSettings`
+ `types.ts` + `utils/defaultSettings.ts` + Admin > Definições (`AdminIdentitySection`),
não outro literal no código. Conteúdo demo é fictício por definição: sem nomes de pessoas
reais, sem parceiros reais, sem fotos reais.
