# AGENTS.md — Community Platform (ARCVA 2.0)

Plataforma white-label para associações culturais e recreativas, construída pela
[BolaLabs](https://bolalabs.pt). A instância de referência em produção é o portal da
**ARCVA** ([arcva.pt](https://arcva.pt)) — todo o conteúdo ARCVA no repositório é seed/demo,
a identidade em runtime vem das settings da BD (ver `docs/WHITE-LABEL.md`).

SPA em **React 19 + TypeScript 5 + Vite 8 (Rolldown)** com **Tailwind CSS 3** e backend
realtime **Convex** (queries, mutations, actions IA, storage, crons — nada corre em servidor
próprio). IA via **Google Gemini** server-side, com camada multi-provedor OpenAI-compatível.
UI em Português (pt-PT), código e comentários em inglês.

## Comandos

```bash
npm run dev          # Frontend em http://localhost:3000 (deteta porta ocupada e pergunta)
npm run dev:kill     # Igual, mas mata logo o processo que estiver na porta
npx convex dev       # Backend Convex (terminal separado) — regenera convex/_generated
npm run build        # tsc && vite build
npm run dist         # build + validação + community-platform-dist.zip pronto para o servidor
npm run type-check   # tsc --noEmit
npm run lint         # ESLint, zero warnings
npm run preview      # Servir o build local
```

- **Não existem testes.** Não inventar `npm test` nem criar ficheiros de teste sem pedido
  explícito. A verificação mínima antes de dar por terminado: `npm run type-check` +
  `npm run lint` (+ `npm run build` para mudanças de build/config).
- `convex/_generated/` está **commitado** (recomendação oficial do Convex — sem ele o
  typecheck falharia num clone fresco). Nunca editar à mão; regenera-se com
  `npx convex codegen` ou automaticamente durante `npx convex dev`.

## Arquitetura (o que não é óbvio a ler um ficheiro)

- **Tudo é DB-first e o repo é genérico.** `settings` (tabela única) alimenta identidade
  (nome, nome completo, localidade, ano, hero, sede, textos da História), contactos,
  coordenadas, quotas, Sobre, redes e toda a config de IA. Hierarquia de fallback:
  BD (admin) → `process.env` (servidor) → `VITE_*` (build) → defaults em
  `utils/defaultSettings.ts`, que são uma associação FICTÍCIA ("ACR Vila Nova"). Nenhum
  ficheiro versionado nomeia a ARCVA ou pessoas reais; a instância real vive em três
  camadas gitignored: BD, `.env.production` (meta tags via `%VITE_*%` no `index.html`,
  plugin `siteMeta` do `vite.config.ts`) e `.brand/public/` (overlay de logos/fotos/OG,
  servido em dev pelo plugin `brandOverlay` e copiado para `dist/` pelo `npm run dist`).
  Ver `docs/WHITE-LABEL.md`. Campo de identidade novo = schema + `settings.*` +
  `seedHelpers.updateSettings` + `types.ts` + defaults + `AdminIdentitySection`.
- **Modelos IA têm fonte única**: `convex/lib/aiDefaults.ts`. Tanto o frontend
  (`utils/defaultSettings.ts`) como as actions (`convex/ai.ts`) importam de lá — não
  duplicar strings de modelo em mais lado nenhum.
- **Identidade do assistente IA é dinâmica**: `convex/ai.ts` constrói o system prompt com
  `settings.siteName`/`address` (via `settings.getForAI`, que é um subconjunto explícito de
  campos — ao precisar de um campo novo numa action, adicioná-lo lá, não usar `getAdmin`).
- **Chaves de provedor são write-only**: aceites em `settings.update`, removidas de
  `getPublic`/`getAdmin` (substituídas por flags `has*ApiKey`). Nunca devolver segredos
  em queries. `GEMINI_API_KEY` vive só no deployment Convex, nunca em `.env`/bundle.
- **Guardrails do chat**: pré-filtro regex de injection + classificação
  (ASSOCIACAO/LOCAL/GERAL/FORA_DE_TEMA/INJECTION) antes do modelo principal. Erros de
  provider viram tokens estáveis `ERR_*` (ConvexError) que o `AIModal` mapeia para
  mensagens amigáveis — mensagens de erro cruas nunca chegam ao cliente.
- **Multi-provedor** em `convex/lib/aiProvider.ts`: chat/classificação/enhanceText correm em
  gemini | openrouter | custom (OpenAI-compatível, ex: Ollama). TTS, imagem e geo são
  SEMPRE Gemini, independentemente do provedor de chat.
- **RAG**: `convex/lib/aiContext.ts` injeta dados reais do portal (eventos, equipa,
  notícias, settings) no system prompt. Histórico multi-turno: últimas 6 mensagens.
- **Listas públicas vs backoffice**: `DataContext` expõe `events`/`posts` (só publicados) e
  `adminEvents`/`adminPosts` (incluem rascunhos via `listAll`). Não misturar.
- **Upload de imagens**: sempre Convex storage (`files.generateUploadUrl` + `files.getUrl`)
  via MediaStudio — nunca base64 em documentos.
- **Admin sem comandos**: BD sem admin redireciona qualquer acesso para o wizard `/setup`.
  Fallback CLI raro: `npx convex run lib/bootstrapAdmin:setUserRole`.

## Regras Convex (obrigatórias)

- Mutations admin: primeira linha `await requireAdmin(ctx)`. Mutations de user:
  `await requireAuth(ctx)`. Queries públicas sem guard; queries "soft" usam `isAdmin(ctx)`
  e devolvem `[]`/`null` para não-admins em vez de throw.
- `.withIndex()` em vez de `.filter()`; `v.union(v.literal(...))` para enums.
- `??` para defaults booleanos, nunca `||`.
- Inputs validados com `validateMaxLength()`/`validateEmail()` de `convex/lib/validation.ts`;
  rate limiting em mutations públicas via `convex/lib/rateLimit.ts` (token bucket).
- Cascade delete + storage cleanup via `convex/lib/cascade.ts`
  (`cleanupStorageOnDelete`/`cleanupStorageOnUpdate`) ao apagar/atualizar entidades pai.

## Standards de código

- Function components only, PascalCase, props interface `{ComponentName}Props`.
- Nunca `any` — preferir `unknown` ou inferência. Type imports: `import type { X }`.
- Interfaces partilhadas em `types.ts`; `.tsx` para componentes, `.ts` para utilitários.
- Ordem de imports: React → terceiros → componentes locais → hooks/context → types.
- Ficheiros < 300 linhas, funções < 50 linhas; ordem: imports → constantes → helpers → export.
- Proibido: inline `style={{}}`, class components, mutação direta de estado, componentes
  aninhados, hooks condicionais, comentários conversacionais.

## Styling

- Tailwind exclusivamente; `cn()` de `utils/cn.ts` para classes condicionais.
- Tema claro + escuro (`darkMode: 'class'`, default escuro em `hooks/useTheme.ts`),
  estética glassmorphism. Toda a cor que assume fundo escuro precisa de par light:
  `bg-white dark:bg-dark-surface`, `text-slate-900 dark:text-white`.
- Exceções dark-only nos dois temas: texto sobre fotos com overlay, cartão de sócio,
  backoffice `/admin` e `/setup`.
- Brand: vermelho ARCVA `brand-600` #df3d32 (light) / `brand-400`-`brand-500` (dark);
  accent gold #fbbf24; neutrals slate (dark bg #020617, surface #0f172a).
- Radius: `rounded-xl`/`rounded-2xl`/`rounded-3xl`. Foco visível:
  `focus-visible:ring-2 focus-visible:ring-brand-500` em todos os interativos.
- Lightbox partilhado: `components/ui/Lightbox.tsx` (controlado por index).

## Acessibilidade e performance

- HTML semântico; `aria-label` em botões só-ícone; navegação por teclado (Enter/Space).
- Debounce 500ms em pesquisa; lazy load de modais/páginas pesadas; paginação em datasets
  grandes; `React.memo`/`useMemo` com moderação.

## Comentários

- Explicar PORQUÊ, não O QUÊ. Sem emojis, sem pontos de exclamação, sem tom de LLM.
- JSDoc apenas para tipos complexos.

## Ficheiros e artefactos

- NUNCA criar mocks/stubs, nem PNGs/JPGs/temporários na raiz do projeto.
- Screenshots → `.artifacts/screenshots/` · docs de agentes → `.artifacts/docs/` ·
  logs → `.artifacts/logs/` (tudo gitignored).
- **Entregáveis longos não vão para o chat.** Guias, runbooks, relatórios ou planos com
  mais de ~60 linhas escrevem-se num ficheiro em `.artifacts/docs/` (e, em agentes que o
  suportem, publicam-se como página/Artifact); a resposta leva o link e um resumo curto.
  Textos pequenos e decisões ficam na conversa.
- Perguntar antes de mudanças arquiteturais.
- NUNCA commitar `.env`, `.env.local` ou ficheiros com segredos.

## Documentação

- [README.md](README.md) (EN) / [README.pt.md](README.pt.md) — visão geral e setup
- [DEPLOY.md](DEPLOY.md) (IIS/Windows) / [DEPLOY-VPS.md](DEPLOY-VPS.md) (Linux/nginx)
- [docs/WHITE-LABEL.md](docs/WHITE-LABEL.md) — checklist para lançar uma nova associação
- [docs/ARCVA-UPDATE.md](docs/ARCVA-UPDATE.md) — runbook de atualização da instância arcva.pt
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — tokens, tipografia, padrões de UI
- [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md)
