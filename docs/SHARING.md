# Sharing and link previews

What an association publishes travels mostly by WhatsApp and Facebook. This page covers how a
shared link looks, and the one server change that makes each event show its own poster.

## What works everywhere, with no setup

- Every event has its own address: `/events/<slug>`. Opening it shows the event; the browser's
  Back button closes it. Articles already lived at `/blog/<slug>`.
- The event dialog and the article page carry a share bar: **WhatsApp**, **Facebook**,
  **Copiar link**, and the phone's own share sheet where one exists. They are plain links —
  no SDK, no tracking script, no CSP exception.
- The WhatsApp message carries what, when and where, with the link on its own line:

  ```
  *Arraial de Vila Nova*
  Sábado, 18 de julho às 21:00 · Pavilhão
  https://example.org/events/arraial-de-vila-nova
  ```

## Previews that show the event's own poster

WhatsApp, Facebook, LinkedIn and Telegram build the preview card from the page's Open Graph
tags, and they read the HTML **without running JavaScript**. The portal is a single-page app,
so without help every link previews as the generic site card.

The platform ships the help: Convex serves a preview page per published item at

```
https://<deployment>.convex.site/share/events/<slug>
https://<deployment>.convex.site/share/blog/<slug>
```

with the item's title, date, place, excerpt and image. Drafts and unknown slugs describe
nothing and redirect to the list. People who land on it are sent to the real page by script,
which crawlers never run, so none of them loops back.

What is left is routing crawler requests for `/events/<slug>` and `/blog/<slug>` on the
site's own domain to that page, so the preview stays attributed to the site.

### IIS (Windows) without ARR — redirect

Needs only URL Rewrite, which every IIS deployment of this platform already has. Build the
instance with `VITE_SHARE_PREVIEWS=redirect`: crawler requests get a 302 to the preview page.
WhatsApp, Telegram and LinkedIn follow it the way they follow a shortened link and build the
card from the preview page, whose `og:url` names the site's own address. Facebook also follows
it; its Sharing Debugger may note that the canonical URL redirects, which does not stop the
card. People never see the redirect: only the crawler user agents listed below match.

This is what the reference instance runs. The ARR 3.0 installer stalls unattended on Windows
Server 2025 (quiet mode confirmed in its log), so the proxy route below is for servers where
ARR installs cleanly.

### IIS (Windows) with ARR — proxy

Needs **Application Request Routing** (free, from Microsoft) with the proxy enabled and the
host header **not** preserved — Convex routes by host name:

```powershell
# once per server, as administrator
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name enabled -Value True
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/proxy' -Name preserveHostHeader -Value False
```

Then build the instance with `VITE_SHARE_PREVIEWS=proxy`, which answers on the site's own URL
with no redirect at all. The build adds the rule to
`web.config` itself, pointing at the deployment in `VITE_CONVEX_URL` (or
`VITE_CONVEX_SITE_URL` for a self-hosted backend). Without ARR the rule would turn every
crawler request into an error, which is why it is opt-in.

### nginx

```nginx
map $http_user_agent $preview_crawler {
    default 0;
    ~*(facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|Pinterestbot|SkypeUriPreview|redditbot|Viber|Iframely|Embedly|Bluesky|Mastodon) 1;
}

location ~ ^/(events|blog)/([^/]+)/?$ {
    if ($preview_crawler) {
        rewrite ^/(events|blog)/([^/]+)/?$ /share/$1/$2 break;
        proxy_pass https://<deployment>.convex.site;
    }
    try_files $uri /index.html;
}
```

`proxy_pass` to an HTTPS upstream sends the upstream's host by default, which is what Convex
needs; add `proxy_ssl_server_name on;` if your nginx is older than 1.25.

### Checking a preview

```bash
curl -s -A "WhatsApp/2.23" https://example.org/events/<slug> | grep og:
```

Facebook caches previews; its Sharing Debugger re-reads a URL after a poster changes.

## Images

Uploads are optimised in the browser before they reach storage: the long edge is capped at
2000 px, phone rotation is applied, and photos are re-encoded as JPEG (logos with
transparency stay PNG). A 4 MB poster exported from Canva lands at around 150-400 KB, light
enough for mobile data and for preview crawlers, which give up on heavy images.
