# Deploy numa VPS Linux (nginx)

O portal é uma SPA estática (Vite) que fala com o backend Convex na cloud —
na VPS só é preciso servir ficheiros estáticos com fallback de SPA e HTTPS.
O backend (funções, base de dados, storage) já está deployed em
`https://<deployment>.convex.cloud` e não corre na VPS.

> Para VPS Windows com IIS, segue o [DEPLOY.md](DEPLOY.md) — o processo é o
> mesmo, apenas muda a máquina. Este guia cobre o caso comum de VPS Linux.

## 0. Pré-requisitos

- VPS Linux (Ubuntu/Debian) com acesso SSH e sudo
- Domínio apontado para o IP da VPS (registo A de `example.org` e `www.example.org`)
- `community-platform-dist.zip` gerado localmente com `npm run dist` (usa `.env.production`)

## 1. Gerar e enviar o build

```bash
# No PC local — valida .env.production, faz o build e cria o zip
npm run dist

# Enviar para a VPS
scp community-platform-dist.zip user@VPS_IP:/tmp/
```

## 2. Instalar na VPS

```bash
sudo apt update && sudo apt install -y nginx unzip
sudo mkdir -p /var/www/community-platform
sudo unzip -o /tmp/community-platform-dist.zip -d /var/www/community-platform
sudo chown -R www-data:www-data /var/www/community-platform
```

`index.html` deve ficar diretamente em `/var/www/community-platform/` (não numa subpasta `dist`).

## 3. Configurar o nginx

`/etc/nginx/sites-available/community-platform`:

```nginx
server {
    listen 80;
    server_name example.org www.example.org;
    root /var/www/community-platform;
    index index.html;

    # Security headers (o certbot --redirect NAO adiciona HSTS)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # SPA fallback: todas as rotas servem o index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # O shell HTML nunca deve ficar em cache: e ele que aponta para os assets novos
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Assets com hash no nome podem ser cacheados agressivamente
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Imagens estaticas (equipa, apoios, cartazes)
    location /images/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/css application/javascript application/json application/xml image/svg+xml;
    gzip_min_length 1024;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/community-platform /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 4. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.org -d www.example.org --redirect
```

A renovação fica automática (`systemctl list-timers | grep certbot`).

## 5. Verificação pós-deploy

1. `https://www.example.org/` abre com o logo da associação e tema escuro por defeito.
2. Alternar tema claro/escuro no botão do menu.
3. `/team` mostra as fotos reais dos órgãos sociais.
4. `/events` mostra torneios com inscrições abertas; submeter uma inscrição de teste.
5. `/admin` pede login; entrar com a conta de administrador de produção.
6. `https://www.example.org/images/team/01.jpg` responde 200 (estáticos ok).

## 6. Atualizações futuras

Repetir passos 1-2 (build + unzip por cima) e `sudo systemctl reload nginx`.
Alterações de backend: `npx convex deploy` a partir do repositório local.
Migrações de conteúdo: `npx convex run migrations:applyOriginalContent --prod`
(idempotente).

## 7. Backup dos dados (Convex)

Antes de migrações ou alterações de conteúdo em massa, exportar um snapshot:

```bash
npx convex export --prod --path backup-$(date +%Y%m%d).zip
```

Restauro (substitui TODOS os dados do deployment — usar com cuidado):

```bash
npx convex import --prod --replace backup-YYYYMMDD.zip
```

Recomendado: guardar um export semanal fora da VPS.

## Notas

- O `web.config` incluído no zip é ignorado pelo nginx (é só para IIS).
- Segredos (chave Gemini, JWT) vivem no Convex Dashboard, nunca na VPS.
- CSP: está definida via meta tag no `index.html`; se preferires movê-la para
  header do nginx, remove a meta tag para evitar duplicação.
