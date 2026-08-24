# Guião — Migrar e atualizar o portal ARCVA (arcva.pt)

Runbook do operador para a instância de referência. Cobre dois cenários: **A)** pôr a
versão atual em produção (a atualização white-label de 2026-08) e **B)** o ciclo normal de
atualizações futuras. A primeira instalação de raiz (cutover do site antigo no IIS) está no
[DEPLOY.md](../DEPLOY.md) Partes 1–4 e não se repete aqui.

Ambientes:

| | Deployment Convex | Frontend |
|---|---|---|
| Dev | `fabulous-quail-25` | `npm run dev` local |
| Produção | `savory-bird-627` (`https://savory-bird-627.convex.cloud`) | IIS na VPS Contabo Windows, site arcva.pt |

## A) Atualização 2026-08 (white-label + modelos IA)

Esta versão muda **backend e frontend**, e exige um passo manual nas definições de
produção. Pela ordem:

### 1. Commit e verificação local

```bash
git add -A
git commit -m "feat: white-label platform, current Gemini lineup, public release docs"
npm run type-check && npm run lint && npm run build
```

### 2. Backend para produção

O `convex/` mudou (ai.ts, settings.ts, lib/aiDefaults.ts):

```bash
npx convex deploy
```

Sem migração de dados: o schema não mudou; as settings existentes continuam válidas.

### 3. Atualizar os modelos IA em produção (IMPORTANTE)

A Google desligou a família Gemini 2.0 (jun/2026). Se as definições de produção ainda
apontam para `gemini-2.0-*`, o chat sobrevive graças ao retry automático para o modelo
default, mas o TTS/imagem não têm retry — atualizar já:

1. Abrir `https://arcva.pt/admin` → **IA & Chatbot**
2. Modelo Principal: **Gemini 3.5 Flash** · Fallback: **Gemini 3.5 Flash Lite**
3. TTS: **Gemini 2.5 Flash TTS** · Imagem: **NanoBanana 2** (`gemini-3.1-flash-image`)
4. Guardar Alterações e testar o chatbot no portal público

> Verificar também a quota da `GEMINI_API_KEY` de produção em
> [aistudio.google.com](https://aistudio.google.com) — a chave dev esgotou o free tier
> durante os testes; se acontecer em produção, o portal degrada graciosamente mas sem IA.

### 4. Frontend para o IIS

```bash
npm run dist          # valida .env.production, faz build, cria arcva-v2-dist.zip
```

Na VPS (RDP): extrair o zip para a pasta do site (ex: `C:\inetpub\arcva-v2\`),
substituindo o conteúdo. O `index.html` não é cacheado (web.config), por isso os
visitantes apanham a versão nova ao primeiro refresh.

> Se o cutover inicial ainda não foi feito (site antigo ainda no ar): seguir o
> [DEPLOY.md](../DEPLOY.md) Partes 3–4 — instalar na porta 8080, validar, e só depois
> trocar o Physical Path do site arcva.pt.

### 5. Smoke test pós-deploy

- [ ] `https://arcva.pt` abre, tema escuro por default, sem erros na consola
- [ ] Chatbot responde (pergunta: "Quais são os próximos eventos?")
- [ ] `/admin` entra com a conta de produção; Dashboard mostra dados
- [ ] Uma edição de teste em Admin > Definições grava e reflete no portal
- [ ] `/setup` redireciona para fora (já existe admin)

### Rollback

- Frontend: repor o zip anterior (guardar sempre o zip da versão em produção antes de
  substituir) ou trocar o Physical Path de volta — <60s
- Backend: `npx convex deploy` de um checkout do commit anterior

## B) Ciclo normal de atualizações futuras

| Mudou o quê? | O que correr |
|--------------|--------------|
| Só conteúdo (eventos, notícias, definições) | Nada — o admin publica em tempo real |
| Código do site (`pages/`, `components/`, estilos) | `npm run dist` → substituir o zip no IIS |
| Código do backend (`convex/`) | `npx convex deploy` → e, se o frontend também mudou, o passo anterior |
| Modelos IA retirados pela Google | Admin > IA & Chatbot → escolher a geração nova (os dropdowns são atualizados no código quando a gama muda) |

Regra prática: **backend primeiro, frontend depois** — as queries/actions novas têm de
existir antes de o bundle novo as chamar. O inverso (backend novo + frontend velho) é
seguro porque as assinaturas existentes não se removem sem major version.

## Divulgação (release público)

### 0. Limpar dados pessoais do histórico git (OBRIGATÓRIO antes de publicar)

O telefone da presidente entrou no histórico no commit `9faff81` (julho). O working tree
já está limpo (o número vive só na BD de prod e no `.env.local` gitignored; a migração lê
`SITE_PHONE` do ambiente Convex), mas tornar o repo público expõe o histórico inteiro.
Duas vias:

**Opção A — reescrever o histórico (mantém o historial público completo):**

```bash
pip install git-filter-repo
printf '<NUMERO_REAL>==>+351 212 345 678\n' > /tmp/replacements.txt
git filter-repo --replace-text /tmp/replacements.txt
# filter-repo remove o remote por segurança; voltar a ligar e forçar
git remote add origin https://github.com/brunobola-portfolio/nextgen-community-platform.git
git push --force --all && git push --force --tags
```

**Opção B — publicar com histórico novo (mais simples; o historial detalhado fica no
repo privado):** — *executada em 2026-08-24; o historial anterior está no branch
`private-history` do remoto privado.*

```bash
git checkout --orphan public-release
git commit -m "feat: Community Platform 2.0 — public release"
git branch -M public-release main   # substitui o main local
git push --force origin main
```

### 1. Renomear, transferir e publicar

```bash
gh repo rename community-platform -R brunobola-portfolio/nextgen-community-platform
gh api repos/brunobola-portfolio/community-platform/transfer -f new_owner=BolaLabs
gh repo edit BolaLabs/community-platform --visibility public --accept-visibility-change-consequences
git remote set-url origin https://github.com/BolaLabs/community-platform.git
gh release create v2.0.0 --title "Community Platform 2.0" --notes-file CHANGELOG.md
```

Confirmar depois que o site da BolaLabs (bolalabs.pt) aponta o cartão "Community
Platform" para o repositório público além do arcva.pt.

## CI/CD para a evolução futura

Conteúdo (eventos, notícias, definições) não precisa de pipeline — publica-se em tempo
real pelo admin. O CI/CD cobre só mudanças de **código**:

| Fase | O que corre | Estado |
|------|-------------|--------|
| **CI** — cada push/PR | `.github/workflows/ci.yml`: codegen + type-check + lint + build | Pronto |
| **Release** — tag `vX.Y.Z` | `.github/workflows/release.yml`: build de produção, zip anexado à GitHub Release, e `npx convex deploy` automático se o secret existir | Pronto (secret opcional) |
| **Instalação no IIS** | Manual (RDP, secção B acima) — descarregar o zip da Release e extrair | Runbook |

Para ativar o deploy automático do backend: Convex Dashboard → Settings → **Generate
production deploy key** → guardar como secret `CONVEX_DEPLOY_KEY` no repositório GitHub
(Settings → Secrets and variables → Actions). Sem o secret, a release cria o zip na mesma
e o `npx convex deploy` faz-se localmente.

Fluxo de trabalho recomendado a partir daqui:

```bash
git checkout -b feature/nova-funcionalidade   # desenvolver + validar local
# PR → CI verde → merge em main
git tag v2.1.0 && git push origin v2.1.0      # release: zip + deploy backend
# IIS: instalar o zip da Release (secção B)
```

Passo seguinte natural (quando justificar): um **self-hosted runner** do GitHub Actions
na VPS Windows a extrair o zip para o Physical Path — deploy do frontend sem RDP. Até lá,
o passo manual de 2 minutos mantém-se o elo humano de segurança antes de tocar em produção.
