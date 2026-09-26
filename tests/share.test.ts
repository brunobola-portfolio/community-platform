import { describe, expect, it } from 'vitest';
import { absoluteUrl, eventPath, eventShareText, facebookShareUrl, postPath, whatsappShareUrl } from '../utils/share';
import { escapeHtml, renderSharePage, scriptString, shortDescription, SHARE_DESCRIPTION_LENGTH } from '../convex/lib/shareHtml';
import { convexSiteOrigin, sharePreviewRule } from '../vite.config';

describe('share links', () => {
  it('builds addresses a slug cannot break out of', () => {
    expect(eventPath('festa de verão')).toBe('/events/festa%20de%20ver%C3%A3o');
    expect(postPath('a/b')).toBe('/blog/a%2Fb');
    expect(absoluteUrl('/events/x', 'https://example.org')).toBe('https://example.org/events/x');
  });

  it('puts the link on its own last line for WhatsApp, where the preview is built from it', () => {
    const url = whatsappShareUrl('*Arraial*\nSábado', 'https://example.org/events/arraial');
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text.split('\n').at(-1)).toBe('https://example.org/events/arraial');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
  });

  it('sends only the URL to Facebook, which ignores any text', () => {
    expect(facebookShareUrl('https://example.org/blog/x?a=1'))
      .toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.org%2Fblog%2Fx%3Fa%3D1');
  });

  it('writes what, when and where for an event', () => {
    const text = eventShareText({ title: 'Arraial', date: '2026-06-13T21:30:00', location: 'Sede' });
    const [title, line] = text.split('\n');
    expect(title).toBe('*Arraial*');
    expect(line).toMatch(/^S[áa]bado, 13 de junho às 21:30 · Sede$/);
  });

  it('leaves the time out of an all-day event', () => {
    expect(eventShareText({ title: 'Feira', date: '2026-06-13T00:00:00' })).not.toContain(' às ');
  });
});

describe('preview page', () => {
  const card = {
    siteName: 'ACR Vila Nova',
    title: 'Arraial "de" <Verão>',
    description: 'Música e sardinhas.',
    image: 'https://x.convex.cloud/api/storage/abc',
    canonicalUrl: 'https://example.org/events/arraial',
    type: 'event' as const,
  };

  it('carries the content, not the generic site card', () => {
    const html = renderSharePage(card);
    expect(html).toContain('<meta property="og:image" content="https://x.convex.cloud/api/storage/abc">');
    expect(html).toContain('<meta property="og:url" content="https://example.org/events/arraial">');
    expect(html).toContain('<meta property="og:description" content="Música e sardinhas.">');
  });

  it('escapes a title that tries to leave its attribute', () => {
    const html = renderSharePage(card);
    expect(html).toContain('content="Arraial &quot;de&quot; &lt;Verão&gt;"');
    expect(html).not.toContain('<Verão>');
  });

  it('falls back to the site card, with its known size, when there is no poster', () => {
    const html = renderSharePage({ ...card, image: undefined });
    expect(html).toContain('content="https://example.org/og-image.png"');
    expect(html).toContain('og:image:width');
  });

  it('never states a size for a poster, which can be any shape', () => {
    expect(renderSharePage(card)).not.toContain('og:image:width');
  });

  it('redirects people by script, which crawlers never follow', () => {
    const html = renderSharePage(card);
    expect(html).not.toContain('http-equiv="refresh"');
    expect(html).toContain('location.replace("https://example.org/events/arraial")');
  });

  it('keeps a hostile URL from closing the script element', () => {
    expect(scriptString('</script><script>alert(1)</script>')).not.toContain('</script>');
  });

  it('trims long descriptions itself rather than leaving it to each app', () => {
    const long = shortDescription('palavra '.repeat(100));
    expect(long.length).toBeLessThanOrEqual(SHARE_DESCRIPTION_LENGTH + 1);
    expect(long.endsWith('\u2026')).toBe(true);
    expect(escapeHtml(`'`)).toBe('&#39;');
  });
});

describe('crawler proxy rule', () => {
  it('derives the HTTP-actions origin from the functions URL', () => {
    expect(convexSiteOrigin({ VITE_CONVEX_URL: 'https://happy-animal-123.convex.cloud' }))
      .toBe('https://happy-animal-123.convex.site');
    expect(convexSiteOrigin({ VITE_CONVEX_URL: 'https://self-hosted.example.org' })).toBeNull();
    expect(convexSiteOrigin({ VITE_CONVEX_SITE_URL: 'https://api.example.org/' })).toBe('https://api.example.org');
  });

  it('routes preview crawlers only, never a search engine', () => {
    const rule = sharePreviewRule('https://x.convex.site');
    expect(rule).toContain('WhatsApp');
    expect(rule).toContain('facebookexternalhit');
    expect(rule).not.toMatch(/Googlebot|bingbot/i);
    expect(rule).toContain('url="https://x.convex.site/share/{R:1}/{R:2}"');
  });

  it('proxies with ARR and redirects without it', () => {
    expect(sharePreviewRule('https://x.convex.site')).toContain('<action type="Rewrite"');
    const redirect = sharePreviewRule('https://x.convex.site', 'redirect');
    expect(redirect).toContain('<action type="Redirect"');
    expect(redirect).toContain('redirectType="Found"');
  });
});
