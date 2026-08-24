# White-Label — Lançar o portal de outra associação

Este repositório é uma plataforma genérica; a ARCVA ([arcva.pt](https://arcva.pt)) é a
instância de referência e o seu conteúdo vive no repo apenas como **seed/demo**. A
identidade em runtime é DB-first: o assistente IA, o chat, o footer, a navbar e os títulos
das páginas leem `settings.siteName` e restantes campos das Definições — mudam sem tocar
no código.

O que segue é a checklist completa para pôr uma nova associação no ar, por camadas: o que
se resolve no **admin** (a maior parte), o que se resolve em **variáveis de ambiente**, e o
que exige **editar ficheiros** (branding estático e conteúdo demo).

## 1. Camada admin (sem código)

Deploy feito (ver [DEPLOY.md](../DEPLOY.md) ou [DEPLOY-VPS.md](../DEPLOY-VPS.md)), conta
criada em `/setup`:

- **Admin > Definições** — nome do site, email de contacto, logo, telefone, horário,
  morada, link Maps, latitude/longitude, redes sociais, missão e pilares da página Sobre,
  quotas e dados de pagamento (MB WAY/IBAN/Multibanco)
- **Admin > IA & Chatbot** — fornecedor, modelos, guardrails, tópicos permitidos/proibidos,
  prompt extra (é aqui que se afina a persona do assistente, ex: nome completo da associação)
- **Admin > História** — apagar os milestones ARCVA, criar os da nova associação
- **Admin > Eventos / Notícias / Membros / Parceiros / Galeria / Categorias / Homepage** —
  substituir o conteúdo demo criado pelo seed (ou não correr `seed:seed` de todo e começar vazio)

## 2. Camada ambiente (build/deploy)

Os defaults de `utils/defaultSettings.ts` são overridable por `VITE_*` sem editar código —
úteis para o primeiro render antes de a BD responder e para deployments sem seed:

- `VITE_SITE_NAME`, `VITE_CONTACT_EMAIL`, `VITE_PHONE`, `VITE_ADDRESS`, `VITE_MAPS_URL`,
  `VITE_LATITUDE`, `VITE_LONGITUDE`, `VITE_OPENING_HOURS`
- `VITE_FACEBOOK_PAGE_ID`, `VITE_INSTAGRAM_URL`
- `VITE_AI_ALLOWED_TOPICS`, `VITE_AI_FORBIDDEN_TOPICS`, `VITE_CHAT_MODEL`, etc.

No deployment Convex (server-side): `GEMINI_API_KEY` (obrigatória para IA) e opcionalmente
`SITE_LATITUDE`/`SITE_LONGITUDE` para o geo-assistente.

## 3. Camada ficheiros (branding estático)

Estes ficheiros são servidos antes de o JavaScript correr, por isso não podem vir da BD:

| Ficheiro | O que mudar |
|----------|-------------|
| [index.html](../index.html) | `<title>`, meta description/keywords, todas as tags OG/Twitter, `og:url`, `canonical` |
| [public/manifest.json](../public/manifest.json) | `name`, `short_name`, `description` |
| [public/favicon.svg](../public/favicon.svg) e logos em `public/` | Substituir pelos da nova marca (mesmo nome de ficheiro evita tocar no código) |
| [public/og-image.png](../public/og-image.png) | Imagem 1200x630 para partilhas sociais |
| [public/robots.txt](../public/robots.txt) e [public/sitemap.xml](../public/sitemap.xml) | Trocar o domínio |
| [tailwind.config.ts](../tailwind.config.ts) | Escala `brand` (a vermelha ARCVA #df3d32) pela cor da nova marca |
| [.env.production](../.env.production.example) | URL do Convex de produção + `VITE_*` da nova identidade |

## 4. Conteúdo demo restante no código

Copy de página com sabor ARCVA que fica no repo como conteúdo demo. Renderiza-se apenas
como fallback ou como texto decorativo — substituir se a estética da nova instância o pedir:

- [pages/Home.tsx](../pages/Home.tsx) — headline do hero ("Vale Alto / ARCVA") e subtítulos de secção
- [pages/About.tsx](../pages/About.tsx) — copy do pavilhão e labels decorativas de localidade
- [pages/History.tsx](../pages/History.tsx) — `FALLBACK_MILESTONES` (só aparecem com a tabela `milestones` vazia)
- [utils/defaultSettings.ts](../utils/defaultSettings.ts) — defaults hardcoded (última camada do fallback)
- [convex/seed.ts](../convex/seed.ts) / [convex/mockData.ts](../convex/mockData.ts) — dados do seeder (opcional: não correr o seed)

## Regra para contribuidores

Identidade nova entra SEMPRE via `settings` (BD) ou `VITE_*` — nunca hardcoded em
componentes ou prompts. Se um campo de identidade ainda não existe nas settings, o caminho
é adicioná-lo a `convex/schema.ts` + `settings.getForAI`/`getPublic` + Admin > Definições,
não outro literal no código.
