# Deploy ARCVA 2.0

Guia passo-a-passo para colocar o portal novo a **substituir o site atual, no mesmo domínio**, num servidor Windows com IIS — **sem mudar DNS e sem downtime**.

| | |
| --- | --- |
| **Tempo total** | ~50 min (15 backend + 5 build + 20 IIS + 10 cutover) |
| **Custo adicional** | 0 EUR/mês (servidor já pago, Convex e Gemini em free tier) |
| **Risco** | Baixo — o site antigo continua online até trocares 1 campo no IIS; rollback em <60s |
| **Pré-requisito de domínio** | Domínio + certificado HTTPS **já instalados** no IIS |

---

## Como funciona (1 minuto de leitura)

O portal tem duas metades:

```text
   O TEU PC                          A CLOUD / O SERVIDOR
   --------                          --------------------

   npm run build  ---- ZIP ---->   IIS (Windows)  ----->  Visitante
   (gera o site)                   serve os ficheiros      abre o domínio
                                          |
   npx convex deploy ----------->  Convex Cloud  <----------+
   (envia o backend)               base de dados + IA       (liga em tempo real)
```

- **Frontend** (o site visível): ficheiros estáticos servidos pelo **IIS**.
- **Backend** (base de dados, login, IA): corre na **Convex Cloud**, grátis. Não instalas nada no servidor para isto.
- A chave da IA (Gemini) vive **só na Convex**, nunca no site.

O deploy são **4 partes em sequência**: (1) backend na cloud, (2) gerar o site, (3) pôr no IIS numa porta de teste, (4) cutover para o domínio real.

> **Porque é seguro:** até ao cutover (Parte 4), o site antigo continua a responder normalmente. O site novo é testado numa porta separada (8080). O cutover é mudar **um campo** no IIS, e desfaz-se em segundos.

---

## Antes de começar

**No teu PC** (onde está o código):

```powershell
node --version      # ^20.19 ou >= 22.12 (requisito do Vite 8)
npm --version       # >= 9
npx convex --help   # CLI Convex (vem com o npm install)
```

Se faltar algo: corre `npm install` na pasta do projeto.

**No servidor Windows** (acesso via RDP):

| Ferramenta | Como confirmar |
| --- | --- |
| **IIS** | `Win+R` → `inetmgr` → abre o IIS Manager |
| **URL Rewrite Module 2.1** | No IIS Manager, clica no servidor → procura o ícone **"URL Rewrite"**. Se não existir, instala-se na Parte 3 (4 MB, sem reboot). |
| **Domínio + certificado HTTPS** | Já instalados (cenário confirmado) |

**Contas:**

| Conta | Para quê | Link |
| --- | --- | --- |
| Convex | Backend + base de dados | já tens (o projeto criado no setup) |
| Google AI Studio | Chave Gemini (IA) | <https://aistudio.google.com/apikey> |

---

## Parte 1 · Backend na cloud — no teu PC · ~15 min

Tudo nesta parte corre **no teu PC**, na pasta do projeto.

### 1.1 — Chave Gemini (se ainda não tens)

1. Abre <https://aistudio.google.com/apikey>
2. **Create API key** → **Create key in new project**
   > Usa sempre **new project**. Reutilizar um projeto antigo pode dar quota 0 (erro `RESOURCE_EXHAUSTED`).
3. Copia a chave (começa por `AIza...`).

### 1.2 — Enviar o backend para produção

```powershell
npx convex deploy
```

Responde **Y** a "Deploy to production?". No fim imprime o URL de produção, por exemplo:

```text
✔ Deployed Convex functions to https://savory-bird-627.convex.cloud
```

### 1.3 — Confirmar o URL de produção (importante)

> **Verifica que o URL impresso acima coincide com o que está no ficheiro `.env.production`** (campo `VITE_CONVEX_URL`). Deve ser `https://savory-bird-627.convex.cloud`.
>
> - **Se coincidir:** ótimo, continua.
> - **Se for diferente:** abre `.env.production`, mete o URL correto em `VITE_CONVEX_URL`, grava. (O build da Parte 2 usa este valor.)
>
> Se enganares isto, o site novo fala com o backend errado e parece "vazio" ou sem dados.

### 1.4 — Secrets e autenticação em produção

```powershell
# Chave Gemini no servidor Convex (nunca no site)
npx convex env set GEMINI_API_KEY "AIza..." --prod

# Autenticação: gera SITE_URL, JWT_PRIVATE_KEY e JWKS para produção
# Troca arcva.pt pelo TEU domínio real
npx @convex-dev/auth --prod --web-server-url https://arcva.pt --skip-git-check --allow-dirty-git-state
```

Confirma que ficou tudo:

```powershell
npx convex env list --prod
# Deve listar: GEMINI_API_KEY, JWT_PRIVATE_KEY, JWKS, SITE_URL
```

### 1.5 — Dados iniciais (opcional)

Para arrancar com eventos/notícias/equipa de exemplo (úteis para testar; substituis pelos reais no painel depois):

```powershell
npx convex run seed:seed --prod
```

> Salta este passo se preferires começar com a base de dados vazia e inserir tudo à mão no painel.

---

## Parte 2 · Gerar o site — no teu PC · ~2 min

### 2.1 — Um comando

```powershell
npm run dist
```

O comando faz tudo e **para com erro claro se algo estiver mal**:

1. Valida que `.env.production` existe e tem `VITE_CONVEX_URL` (mostra o backend alvo)
2. Build de produção (`tsc` + `vite build`)
3. Verifica o resultado: `index.html` e `web.config` presentes, URL de produção embebido no bundle
4. Cria o `arcva-v2-dist.zip` (~4 MB) com `index.html` na **raiz do zip**: `web.config`, `assets/`, imagens, `manifest.json`, `sitemap.xml`, `robots.txt`

> O zip é criado com `tar` (incluído no Windows 10+), com fallback para `Compress-Archive` — não depende de módulos PowerShell.

### 2.2 — (Opcional) pré-visualizar antes de enviar

Ver o site a comunicar já com a base de dados de **produção**:

```powershell
npm run preview
# abre http://localhost:4173 e testa a homepage + chatbot
```

---

## Parte 3 · Pôr no IIS (teste) — no servidor via RDP · ~20 min

O objetivo é ter o site novo a correr numa **porta de teste (8080)**, sem tocar no site atual.

### 3.1 — Copiar e extrair

1. Abre RDP para o servidor.
2. Copia `arcva-v2-dist.zip` do teu PC para o servidor (copy-paste pelo RDP funciona).
3. Cria a pasta `C:\inetpub\arcva-v2\`.
4. Extrai o ZIP para dentro — `index.html` e `web.config` devem ficar **diretamente** em `C:\inetpub\arcva-v2\` (não dentro de uma subpasta `dist`).

### 3.2 — URL Rewrite Module (se faltar)

No IIS Manager, clica no servidor e procura o ícone **"URL Rewrite"**. **Se não existir:**

1. Descarrega: <https://www.iis.net/downloads/microsoft/url-rewrite>
2. Corre o `.msi` (sem reboot).
3. Fecha e reabre o IIS Manager.

> Sem este módulo, a homepage abre mas qualquer rota (`/eventos`, `/admin`, …) dá **404**. O `web.config` já traz as regras prontas — só precisa do módulo instalado.

### 3.3 — Criar o site de teste (porta 8080)

No IIS Manager:

1. Botão direito em **Sites** → **Add Website**
2. Preenche:
   - **Site name:** `ARCVA-v2`
   - **Physical path:** `C:\inetpub\arcva-v2`
   - **Binding:** Type `http` · IP `All Unassigned` · **Port `8080`** · Host name *(vazio)*
3. **OK**

### 3.4 — Permissões e firewall

```powershell
# Firewall: abrir a porta 8080 (PowerShell como administrador)
New-NetFirewallRule -DisplayName "ARCVA v2 HTTP 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

Permissões da pasta: botão direito em `C:\inetpub\arcva-v2` → **Properties → Security** → confirma que **IIS_IUSRS** e **IUSR** têm **Read & Execute**. Se não tiverem, **Edit → Add** e adiciona ambos.

### 3.5 — Criar o admin e validar

Abre, no browser:

- No servidor: `http://localhost:8080`
- Do teu PC: `http://<IP-DO-SERVIDOR>:8080`

**Primeiro acesso = criar o administrador** (a base de dados de produção ainda não tem nenhum):

- [ ] O site redireciona automaticamente para `/setup`
- [ ] Cria a conta admin (email + password com ≥12 caracteres) → entras no `/admin`

> **Faz tu o setup agora, antes de partilhar o URL.** O **primeiro** a abrir `/setup` torna-se o administrador. Depois de existir um admin, `/setup` deixa de funcionar.

Depois valida o resto em `:8080`:

- [ ] Homepage carrega (stats, eventos, notícias, parceiros, footer)
- [ ] Rotas funcionam sem 404: `/about`, `/events`, `/blog`, `/admin`
- [ ] Login com a conta admin entra no painel
- [ ] Chatbot responde (ex.: "Quais os próximos eventos?")
- [ ] Telemóvel: menu e páginas adaptam
- [ ] Consola do browser (F12) sem erros vermelhos

Se algo falhar, vê [FAQ](#faq) e [Resolução de problemas](#resolução-de-problemas).

> Recomendação: deixa o site novo a ser testado em `:8080` durante ~24h (e por outras pessoas) antes do cutover.

---

## Parte 4 · Cutover: substituir o site atual — ~10 min

Aqui o domínio passa a servir o site novo. **O domínio, o HTTPS e o certificado mantêm-se** — só muda a pasta que o IIS serve.

### 4.1 — Checklist final

- [ ] Site novo validado em `:8080`
- [ ] Admin criado e a funcionar
- [ ] (Se aplicável) dados reais já inseridos no painel
- [ ] Sabes qual é o site atual no IIS e a sua pasta

### 4.2 — Backup do site atual

No servidor (ajusta o caminho para a pasta real do site atual):

```powershell
Copy-Item -Path "C:\inetpub\wwwroot\site-atual" -Destination "C:\inetpub\_backup_$(Get-Date -Format yyyyMMdd)" -Recurse
```

### 4.3 — Trocar o Physical Path (recomendado)

No IIS Manager:

1. Clica no site atual (o que responde no teu domínio).
2. Painel direito → **Basic Settings…**
3. Muda **Physical path** para `C:\inetpub\arcva-v2`
4. **OK** → botão direito no site → **Restart**

> **Vantagem:** todos os bindings (domínio, porta 443, certificado HTTPS) ficam intactos. Só muda a pasta servida. É a opção mais segura e a mais fácil de reverter.

### 4.4 — Confirmar

Do teu PC (troca `arcva.pt` pelo teu domínio):

```powershell
curl.exe -I https://arcva.pt        # deve devolver HTTP 200
```

- [ ] `https://teu-dominio` abre o portal novo
- [ ] Cadeado HTTPS verde
- [ ] Login, chatbot e 3-4 páginas funcionam
- [ ] Testar em telemóvel

**Pronto — o site novo está em produção.**

---

## Parte 5 · Atualizações futuras (ir ajustando)

Depois do lançamento, há três tipos de mudança — cada um com o seu fluxo:

### A) Conteúdo (eventos, notícias, equipa, definições, IA)

**Não precisa de deploy.** Faz tudo no painel `/admin`. As alterações aparecem no site em tempo real.

### B) Mudaste código do site (páginas, componentes, estilos)

Repete a Parte 2 e copia para o servidor:

```powershell
npm run dist
```

No servidor: extrai por cima de `C:\inetpub\arcva-v2\` (substitui os ficheiros). Não precisas de recriar o site nem reiniciar o IIS — o `index.html` está marcado como "não cachear", por isso a nova versão aparece no próximo refresh (Ctrl+F5 para garantir).

### C) Mudaste código do backend (pasta `convex/`)

```powershell
npx convex deploy
```

Aplica-se de imediato à cloud; o site já liga ao mesmo backend, não é preciso rebuild do frontend (a menos que também tenhas mudado o frontend).

> Dica: para experimentar sem risco, testa sempre com `npx convex dev` + `npm run dev` localmente antes de fazer `convex deploy` / build de produção.

---

## Rollback de emergência

Se algo correr mal após o cutover:

1. IIS Manager → o site do domínio → **Basic Settings**
2. Volta o **Physical path** para a pasta antiga (a do backup ou a original)
3. Botão direito no site → **Restart**

**Recuperação: <60 segundos.** O site antigo volta exatamente como estava.

---

## FAQ

**Preciso de instalar Node, base de dados ou .NET no servidor?**
Não. O servidor só serve ficheiros estáticos via IIS. Node/npm são só no teu PC (para o build). A base de dados é a Convex Cloud.

**O site antigo desaparece quando crio o site de teste na porta 8080?**
Não. São sites independentes no IIS. O antigo continua no domínio; o novo fica só em `:8080` até fazeres o cutover.

**Esqueci-me e parti o URL antes de criar o admin. E agora?**
Quem abrir `/setup` primeiro fica admin. Se foi outra pessoa por engano: apaga o campo `role` desse utilizador no Convex Dashboard (Data → users) e volta a fazer `/setup`. Em alternativa, promove a conta certa com `npx convex run lib/bootstrapAdmin:setUserRole '{"email":"...","role":"admin"}' --prod`.

**O `/setup` deixou de aparecer e sou enviado para a homepage.**
Normal — já existe um admin. Faz login em `/admin` com essa conta. O wizard só corre uma vez.

**Como mudo o email/telefone/morada/textos do site?**
Painel `/admin → Definições`. Tudo é editável sem código e sem deploy.

**Onde meto a chave da IA? Fica exposta no site?**
A chave fica **só** na Convex (`npx convex env set GEMINI_API_KEY ... --prod`). Nunca entra no build nem no browser.

**Quanto custa isto por mês?**
0 EUR adicionais. Convex free tier: 1M chamadas/mês, 1 GB storage. Gemini free tier: ~1500 pedidos/dia. Folgado para uma associação local.

**Como atualizo o site depois de mudar o código?**
Ver [Parte 5](#parte-5--atualizações-futuras-ir-ajustando).

**Tenho de mudar o DNS / esperar propagação?**
Não. O domínio não muda. Só muda a pasta que o IIS serve. Zero downtime.

**Posso fazer deploy a partir de outro computador?**
Sim. `git clone`, `npm install`, copia `.env.production.example` → `.env.production` (já traz o URL certo) e segue a partir da Parte 1.

---

## Resolução de problemas

**Rotas dão 404 (a homepage funciona, `/eventos` falha)**
URL Rewrite Module não instalado no IIS. Instala de <https://www.iis.net/downloads/microsoft/url-rewrite> e reabre o IIS Manager. O `web.config` já tem as regras.

**O site fica preso em "A iniciar o portal…"**
O frontend não consegue falar com a Convex. Confirma que `VITE_CONVEX_URL` (no `.env.production` usado no build) aponta para o deployment de produção e que a base de dados existe. Vê erros de WebSocket na consola (F12).

**Site novo abre mas está "vazio" / sem dados**
O build apontou para o backend errado. Refaz: confirma `.env.production` (passo 1.3), `npm run build`, recopia o `dist/`.

**"No auth provider found — Check convex/auth.config.ts"**
Faltam `SITE_URL`/`JWKS`/`JWT_PRIVATE_KEY` em produção. Corre `npx @convex-dev/auth --prod --web-server-url https://teu-dominio --skip-git-check --allow-dirty-git-state`.

**Login/registo não grava**
Confirma que o passo 1.4 (`@convex-dev/auth --prod`) correu e que o `--web-server-url` é o teu domínio real.

**Chatbot não responde**
Confirma `GEMINI_API_KEY` em produção (`npx convex env list --prod`) e a quota da chave. Erro `limit 0`: recria a chave em **new project** no AI Studio.

**"Quota exceeded: limit 0"**
Chave Gemini num projeto Google sem free tier. Cria nova em <https://aistudio.google.com/apikey> → **Create key in new project**.

**O domínio ainda mostra a versão antiga**
Limpa a cache (Ctrl+Shift+Del) ou abre em janela anónima. Confirma o **Physical Path** atual do site no IIS Manager.

**Imagens não aparecem**
Confirma que `VITE_CONVEX_URL` aponta para produção e que a CSP em `index.html` inclui `https://*.convex.cloud`.

**Build falha com erros TypeScript**

```powershell
npm run type-check   # mostra os erros em detalhe
```

**`npm run dist` falha a criar o zip**
O comando tenta `tar` (incluído no Windows 10+), depois `pwsh` e `powershell` com `Compress-Archive`. Se todas falharem: confirma que `C:\Windows\System32\tar.exe` existe, ou cria o zip à mão (botão direito na pasta `dist` → Send to → Compressed folder) e garante que `index.html` fica na raiz do zip.

---

## Referência rápida de comandos

```powershell
# -- DESENVOLVIMENTO (no teu PC) --
npm run dev                       # site em http://localhost:3000 (pergunta antes de matar processos na porta)
npm run dev:kill                  # igual, mas mata logo quem estiver na porta
npx convex dev                    # backend (terminal separado)
npm run type-check                # verificar TypeScript
npm run build                     # build de produção (só a pasta dist/)
npm run preview                   # pré-visualizar o build

# -- DEPLOY DE PRODUÇÃO --
npx convex deploy                                             # backend -> cloud
npx convex env set GEMINI_API_KEY "AIza..." --prod           # chave IA
npx @convex-dev/auth --prod --web-server-url https://arcva.pt `
    --skip-git-check --allow-dirty-git-state                 # autenticação
npx convex run seed:seed --prod                              # dados de exemplo (opcional)
npm run dist                                                 # gerar o site + arcva-v2-dist.zip (valida tudo)

# -- DIAGNÓSTICO CONVEX --
npx convex env list --prod        # variáveis de produção
npx convex logs                   # logs em tempo real
npx convex dashboard --prod       # abrir painel de produção

# -- ADMIN --
# Criar admin: abrir o site -> /setup (no browser, sem comandos)
# Reset/fallback (raro):
npx convex run lib/bootstrapAdmin:setUserRole '{"email":"...","role":"admin"}' --prod

# -- IIS (no servidor, via RDP) --
# Abrir o Manager:  Win+R -> inetmgr
New-NetFirewallRule -DisplayName "ARCVA v2 8080" `
    -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow   # firewall
Get-Website | Select-Object Name, State, PhysicalPath               # ver sites
```

---

## Ver também

- [README.md](README.md) — visão geral do projeto, stack e funcionalidades
- [DEPLOY-VPS.md](DEPLOY-VPS.md) — o mesmo deploy numa VPS Linux com nginx
- [docs/ARCVA-UPDATE.md](docs/ARCVA-UPDATE.md) — runbook de atualização da instância arcva.pt
- [docs/WHITE-LABEL.md](docs/WHITE-LABEL.md) — lançar o portal de outra associação
- [CONTRIBUTING.md](CONTRIBUTING.md) — regras de código e convenções
