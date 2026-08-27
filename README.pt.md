<div align="center">

# Community Platform

### A casa digital autogerida para associações culturais e recreativas

<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=0f172a" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-5%20strict-3178C6?logo=typescript&logoColor=white&labelColor=0f172a" alt="TypeScript 5" />
<img src="https://img.shields.io/badge/Vite-8%20(Rolldown)-646CFF?logo=vite&logoColor=white&labelColor=0f172a" alt="Vite 8" />
<img src="https://img.shields.io/badge/Convex-realtime-EE342F?labelColor=0f172a" alt="Convex" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white&labelColor=0f172a" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Gemini_AI-multi--provedor-4285F4?logo=google&logoColor=white&labelColor=0f172a" alt="Gemini AI" />
<img src="https://img.shields.io/badge/licen%C3%A7a-MIT-7fc528?labelColor=0f172a" alt="MIT" />
<a href="https://github.com/brunobola-portfolio/community-platform/actions/workflows/ci.yml"><img src="https://github.com/brunobola-portfolio/community-platform/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>

Plataforma comunitária white-label: backend serverless em tempo real, assistente IA que
responde com o conteúdo publicado da própria associação (RAG) e um backoffice completo para
a direção gerir tudo — eventos, notícias, sócios, quotas, galerias — sem programador.

**Instância de referência:** [arcva.pt](https://arcva.pt) — o portal da ARCVA, associação
cultural portuguesa, a correr exatamente este código.

[Funcionalidades](#funcionalidades) · [Instalação](#instalação) · [Arquitetura](#arquitetura) · [Assistente IA](#assistente-ia) · [White-Label](#lançar-a-tua-associação) · [Deploy](#deploy-para-produção)

[English](README.md) · **Português**

</div>

---

### Quem deve ler o quê

| Se és… | Começa aqui |
| --- | --- |
| Qualquer pessoa — técnica ou não | Esta página, de cima a baixo (~5 minutos) |
| Developer a configurar localmente | [Instalação](#instalação) → [Comandos](#comandos) |
| A lançar o portal de outra associação | [White-Label](#lançar-a-tua-associação) → **[docs/WHITE-LABEL.md](docs/WHITE-LABEL.md)** |
| A fazer release ou deploy | [Deploy](#deploy-para-produção) → **[DEPLOY.md](DEPLOY.md)** (IIS) / **[DEPLOY-VPS.md](DEPLOY-VPS.md)** (nginx) |
| A alterar UI / design visual | **[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)** |
| Um agente de IA | **[AGENTS.md](AGENTS.md)** (guia canónico) + [CLAUDE.md](CLAUDE.md) |

## Screenshots

Instância de referência ([arcva.pt](https://arcva.pt)) — tudo o que se vê é gerido no painel de administração:

| Portal público (escuro) | Portal público (claro) |
|:---:|:---:|
| ![Home, tema escuro](docs/assets/home-dark.png) | ![Home, tema claro](docs/assets/home-light.png) |

| Eventos com filtros e inscrições | Backoffice de administração |
|:---:|:---:|
| ![Página de eventos](docs/assets/events-dark.png) | ![Dashboard admin](docs/assets/admin-dashboard.png) |

| Gestor de galeria: upload múltiplo, legendas, ordenação, capa |
|:---:|
| ![Gestor de galeria](docs/assets/admin-gallery.png) |

## Sobre

A maioria das pequenas associações depende de um voluntário com conhecimentos técnicos — e
para quando essa pessoa sai. Esta plataforma elimina a dependência: depois do deploy
inicial, **tudo se gere no painel de administração**. Eventos com formulários de inscrição
dinâmicos, notícias com editor rich text, equipa, galerias, quotas de sócios, documentos,
notificações, definições do site e o próprio assistente IA — tudo DB-first, tudo editável
pela direção.

**Nada neste repositório nomeia uma associação real.** O seed demo é um clube fictício;
uma instância real vive em três camadas privadas que nunca chegam ao git — a base de dados
(painel admin), um `.env.production` gitignored para as meta tags de build, e um overlay
`.brand/` gitignored para logos, fotos e OG image. Um deployment novo torna-se a *tua*
associação preenchendo as definições no admin, não fazendo fork do código. Ver
[docs/WHITE-LABEL.md](docs/WHITE-LABEL.md).

### Nasceu de uma necessidade real

A plataforma começou como o novo portal da **ARCVA** — uma associação recreativa e
cultural portuguesa — construído pela [BolaLabs](https://bolalabs.pt) para substituir um
site estático que ninguém conseguia atualizar. Cresceu para produto genérico, e a ARCVA é a
sua **parceira fundadora e instância de referência**: cada funcionalidade corre primeiro em
produção para uma comunidade real.

## Funcionalidades

### Portal público

| Página | Destaques |
|--------|-----------|
| **Home** | Hero animado, stats em tempo real, action areas, bento grid de notícias, carousel de eventos, marquee de parceiros |
| **História** | Timeline vertical editável (milestones geridos no admin), galeria de fotos históricas, sócios fundadores |
| **Sobre** | Geo-assistente IA, mapa interativo, pilares de valores, formulário de contacto |
| **Equipa** | Corpos sociais por tabs, fotos, hierarquia |
| **Eventos** | Pesquisa + filtros, export de calendário (Google + ICS), inscrições com formulários dinâmicos por evento |
| **Blog** | Artigo destaque, filtros por categoria com contagem, pesquisa |
| **Post** | Leitura imersiva, TTS "Ouvir Artigo", tags, bio do autor, recomendados |
| **Galeria** | Álbuns com lightbox, navegação por setas/teclado |
| **Área Sócio** | Cartão digital 3D com QR, estado da quota, instruções de pagamento (MB WAY/IBAN/Multibanco), documentos privados, notificações |
| **404** | Página estilizada com navegação de retorno |

### Assistente IA

- **RAG**: injeta dados vivos do portal (eventos, equipa, notícias, settings) no contexto do modelo
- Guardrails de classificação: `ASSOCIACAO / LOCAL / GERAL / FORA_DE_TEMA / INJECTION` + pré-filtro regex
- Histórico multi-turno (últimas 6 mensagens), links de navegação clicáveis, quick-reply chips
- TTS em português (Gemini TTS); guardrails, persona e modelos configuráveis pelo admin
- **Identidade dinâmica**: o assistente apresenta-se com o nome do site vindo das settings

### Painel de administração — 16 tabs de gestão

Dashboard · Homepage · Eventos (rich text + formulários de inscrição dinâmicos + torneios) ·
Notícias · Membros · Parceiros · Gestor de galeria (upload múltiplo por arrastar para o storage, legendas, ordenação, capa, apagar em lote) · Leads & Contactos (workflow de estado) ·
Sócios & Quotas · Timeline da História · Documentos · Notificações · Categorias ·
Níveis de Parceria · IA & Chatbot (fornecedor, modelos, guardrails, analytics) ·
Definições (configuração completa do site)

### Media Studio

Geração de imagens (3 modelos Gemini, 1K–4K), melhoria de texto com tom configurável,
narração TTS — uploads vão para o Convex storage, nunca base64.

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + TypeScript | 19.2 + 5.2 |
| Build | Vite (Rolldown) | 8.1 |
| Styling | Tailwind CSS + clsx + tailwind-merge | 3.4 |
| Backend | Convex (serverless, tempo real) | 1.31 |
| Auth | @convex-dev/auth (password) | 0.0.90 |
| IA | Google Gemini (@google/genai), camada multi-provedor | 1.30 |
| Sanitização | DOMPurify (cliente) + server-side | 3.3 |

## Arquitetura

```
Browser (React 19 + Vite)
    │
    ├── React Context (DataContext)    ← estado global + mapeamento Convex→frontend
    ├── Convex Client (WebSocket)      ← sync em tempo real, queries reativas
    │
    └── Convex Backend (cloud)
         ├── Queries (públicas)        ← list, getById, getPublic
         ├── Mutations (auth guards)   ← requireAdmin / requireAuth
         ├── Actions (IA server-side)  ← GEMINI_API_KEY nunca sai do servidor
         │    ├── chat (RAG + guardrails + classificação)
         │    ├── tts · geoQuery · generateImage · enhanceText
         └── Crons                     ← cleanupRateLimits (hora a hora), cleanupOldLogs (diário)
```

### Padrões de segurança

- **Auth guards**: `requireAdmin(ctx)` na primeira linha de todas as mutations admin, `requireAuth(ctx)` nas de user
- **Soft auth**: `isAdmin(ctx)` em queries que devolvem `[]` para não-admins (sem throw)
- **Rate limiting**: token bucket por ação e por utilizador
- **Sanitização**: server-side + DOMPurify no cliente; CSP restritiva no `index.html`
- **Segredos write-only**: chaves de provedor aceites em `settings.update`, nunca devolvidas (`has*ApiKey`)
- **`GEMINI_API_KEY`**: apenas variável de ambiente Convex — nunca no código, `.env` ou bundle

### Hierarquia de configuração

```
Base de dados (admin)  →  process.env (servidor)  →  VITE_* (build)  →  defaults hardcoded
```

Os modelos de IA têm fonte única: [convex/lib/aiDefaults.ts](convex/lib/aiDefaults.ts) —
frontend e actions importam ambos de lá.

## Instalação

### Pré-requisitos

- Node.js ^20.19 ou >= 22.12 (requisito do Vite 8), npm >= 9
- Conta [Convex](https://convex.dev) (grátis)
- [Chave API do Google Gemini](https://aistudio.google.com/apikey) (grátis)

### Setup rápido

> Alternativa automatizada: `bash scripts/setup.sh` (Linux/macOS) ou
> `powershell -ExecutionPolicy Bypass -File scripts/setup.ps1` (Windows) executa os passos 1–3.

```bash
# 1. Clonar e instalar
git clone https://github.com/brunobola-portfolio/community-platform.git
cd community-platform
npm install

# 2. Configurar Convex (cria o projeto e define VITE_CONVEX_URL)
cp .env.example .env.local
npx convex dev --once

# 3. Chave Gemini (apenas server-side)
npx convex env set GEMINI_API_KEY "AIza..."

# 4. Autenticação (gera SITE_URL, JWT_PRIVATE_KEY, JWKS)
npx @convex-dev/auth --web-server-url http://localhost:3000 \
    --skip-git-check --allow-dirty-git-state

# 5. Popular a base de dados com dados demo
npx convex run seed:seed

# 6. Arrancar (2 terminais)
npx convex dev          # Terminal 1 — backend
npm run dev             # Terminal 2 — frontend (http://localhost:3000)
```

### Criar a conta admin

Sem comandos. Enquanto a base de dados não tem admin, qualquer acesso redireciona para o
**wizard `/setup`**: cria email + password (>= 12 caracteres) e entras no `/admin`.

> Reset (raro): apaga o campo `role` do utilizador no Convex Dashboard, ou usa o fallback
> CLI `npx convex run lib/bootstrapAdmin:setUserRole '{"email":"...","role":"admin"}'`.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend em http://localhost:3000 (deteta porta ocupada e pergunta) |
| `npm run dev:kill` | Igual, mas mata logo quem estiver na porta |
| `npx convex dev` | Backend Convex (terminal separado) — regenera `convex/_generated` |
| `npm run build` | Build de produção (`tsc && vite build`) |
| `npm run dist` | Build + validação + zip pronto para deploy |
| `npm run type-check` | Verificação TypeScript |
| `npm run lint` | ESLint (zero warnings) |
| `npm run preview` | Preview do build local |

Não existe suite de testes; `type-check` + `lint` + `build` são os gates de verificação.

## Assistente IA

### Multi-provedor

Chat, classificação de guardrails e melhoria de texto podem correr em qualquer provedor
OpenAI-compatível, configurado em **Admin > IA & Chatbot** (chaves são write-only —
guardadas no servidor, nunca devolvidas ao browser):

| Provedor | Configuração | Notas |
|----------|--------------|-------|
| `gemini` (padrão) | `GEMINI_API_KEY` | Único com grounding (pesquisa/mapas) |
| `openrouter` | Chave + modelo (ex: `openai/gpt-4o-mini`) | Centenas de modelos |
| `custom` | URL base + modelo (ex: `http://localhost:11434/v1` + `llama3.1`) | Ollama, LM Studio, vLLM |

**TTS, geração de imagens e geo-queries usam sempre Gemini**, independentemente do provedor de chat.

A tab do admin tem um botão **"Testar ligação"** (ida e volta ao fornecedor configurado, com
modelo e latência) e um **catálogo de modelos ao vivo** para OpenRouter e endpoints próprios —
o operador valida o fornecedor antes de guardar, sem CLI.

### Modelos default

Configuráveis por instância em Admin > IA & Chatbot; defaults em
[convex/lib/aiDefaults.ts](convex/lib/aiDefaults.ts):

| Função | Modelo default | Fallback |
|--------|---------------|----------|
| Chat | `gemini-3-flash-preview` | `gemini-2.5-flash` |
| TTS | `gemini-2.5-flash-preview-tts` | — |
| Imagem | `gemini-2.5-flash-image` | Placeholder Unsplash |

### Rate limits (token bucket)

| Ação | Max tokens | Refill/min |
|------|-----------|------------|
| ai:chat / ai:geoQuery / ai:enhanceText | 10 | 10 |
| ai:tts | 5 | 5 |
| ai:generateImage | 3 | 3 |
| content:create / content:update | 20 / 30 | 10 / 15 |
| registration:create | 5 | 5 |

### Degradação graceful

Sem chave API, as funcionalidades IA mostram mensagens de indisponibilidade; o portal
funciona normalmente sem IA.

## Lançar a Tua Associação

A versão curta — checklist completa em **[docs/WHITE-LABEL.md](docs/WHITE-LABEL.md)**:

1. Deploy do backend + frontend (abaixo) com o teu próprio projeto Convex
2. Abrir `/setup`, criar a conta admin
3. Preencher **Admin > Definições**: nome, contactos, morada, coordenadas, redes, quotas
4. Substituir o branding estático: meta tags do `index.html`, logos e OG image em
   `public/`, cor brand no `tailwind.config.ts`
5. Substituir o conteúdo demo (eventos, milestones da história, equipa) no painel admin

## Deploy para Produção

Guias passo-a-passo: **[DEPLOY.md](DEPLOY.md)** (IIS/Windows) e
**[DEPLOY-VPS.md](DEPLOY-VPS.md)** (VPS Linux + nginx).

```bash
# Backend
npx convex deploy
npx convex env set GEMINI_API_KEY "AIza..." --prod
npx @convex-dev/auth --prod --web-server-url https://o-teu-dominio.exemplo \
    --skip-git-check --allow-dirty-git-state

# Frontend (valida .env.production, faz o build e cria o zip)
cp .env.production.example .env.production
npm run dist
```

O resultado é uma pasta estática — qualquer servidor web com fallback de SPA serve. A
instância de referência corre em IIS com rollback em <60s (trocar o Physical Path de volta).

## Design System

Referência completa em [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

| Propriedade | Valor |
|-------------|-------|
| Tema | Claro + escuro (`darkMode: 'class'`, default escuro), glassmorphism |
| Cor brand | `brand-600` #df3d32 (light) / `brand-400`–`brand-500` (dark) |
| Accent | Gold #fbbf24 · Neutrals: slate (dark bg #020617, surface #0f172a) |
| Fontes | Geist (sans), Playfair Display (serif) |
| Radius | `rounded-xl` 12px · `rounded-2xl` 16px · `rounded-3xl` 24px |

## Contribuição

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Destaques: function components only, TypeScript
strict (sem `any`), Tailwind exclusivamente, `requireAdmin(ctx)` na primeira linha das
mutations admin, ficheiros < 300 linhas.

Reportes de segurança: [SECURITY.md](SECURITY.md). Histórico de versões: [CHANGELOG.md](CHANGELOG.md).

## Apoiar o projeto

A plataforma é gratuita e MIT. Se poupa um programador à tua associação, podes ajudar a
mantê-la em andamento:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-brunobola-FF5E5B?logo=ko-fi&logoColor=white&labelColor=0f172a)](https://ko-fi.com/brunobola)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-brunobola-FFDD00?logo=buymeacoffee&logoColor=black&labelColor=0f172a)](https://buymeacoffee.com/brunobola)

Consultoria, alojamento e desenvolvimento à medida para associações: [bolalabs.pt](https://bolalabs.pt).

## Licença

O código é MIT — ver [LICENSE](LICENSE).

**Os ativos de marca não estão cobertos pela licença MIT.** O repositório não inclui o
nome, logo ou fotografias de nenhuma associação real; a instância de referência guarda-os
num overlay privado (ver [docs/WHITE-LABEL.md](docs/WHITE-LABEL.md)). O nome e logo ARCVA
pertencem à associação. Material de terceiros usado pela plataforma:

- Imagens do seed demo alojadas no [Unsplash](https://unsplash.com/license) (Unsplash License)
- Fontes Geist e Playfair Display servidas pelo Google Fonts (SIL Open Font License)
- Ícones [Lucide](https://lucide.dev) (ISC); todas as dependências npm são MIT/Apache-2.0/ISC
- Google Gemini e OpenRouter usam-se sob os respetivos termos; a plataforma nunca inclui uma chave API

Guia de contribuição: [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Contacto

- **Plataforma / técnico**: [bruno@bolalabs.pt](mailto:bruno@bolalabs.pt) · [bolalabs.pt](https://bolalabs.pt)
- **ARCVA (instância de referência)**: [geral@arcva.pt](mailto:geral@arcva.pt) · [arcva.pt](https://arcva.pt)

---

<div align="center">

Construída pela **[BolaLabs](https://bolalabs.pt)** · Em produção desde 2026 em [arcva.pt](https://arcva.pt)

</div>
