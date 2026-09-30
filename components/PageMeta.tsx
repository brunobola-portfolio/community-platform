import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { absoluteUrl } from '../utils/share';

interface PageMetaProps {
  title: string;
  description?: string;
  /** Defaults to the current pathname. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
}

type TagKey = { attr: 'name' | 'property'; key: string };

/**
 * The build-time index.html already carries og:title, description and the
 * twitter tags as the home defaults for crawlers that never run JS. Hoisting a
 * second set would leave duplicates, so those are edited in place and put back
 * when the page unmounts.
 */
function useSyncedTags(entries: Array<[TagKey, string | undefined]>) {
  const signature = JSON.stringify(entries);
  useEffect(() => {
    const restore: Array<() => void> = [];
    for (const [{ attr, key }, value] of entries) {
      if (!value) continue;
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (existing) {
        const previous = existing.getAttribute('content');
        existing.setAttribute('content', value);
        restore.push(() => {
          if (previous === null) existing.removeAttribute('content');
          else existing.setAttribute('content', previous);
        });
      } else {
        const created = document.createElement('meta');
        created.setAttribute(attr, key);
        created.setAttribute('content', value);
        document.head.appendChild(created);
        restore.push(() => created.remove());
      }
    }
    return () => restore.forEach((undo) => undo());
    // entries is fully described by its serialised form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

/**
 * Per-route head tags. Canonical and og:url are rendered natively (React 19
 * hoists them) and are deliberately absent from index.html, where they would
 * point every route at the home page.
 */
export const PageMeta: React.FC<PageMetaProps> = ({ title, description, path, image, type = 'website' }) => {
  const { settings } = useData();
  const { pathname } = useLocation();
  const url = absoluteUrl(path ?? pathname);
  const fullTitle = title && title !== settings.siteName ? `${title} — ${settings.siteName}` : settings.siteName;

  useSyncedTags([
    [{ attr: 'name', key: 'description' }, description],
    [{ attr: 'property', key: 'og:title' }, fullTitle],
    [{ attr: 'property', key: 'og:description' }, description],
    [{ attr: 'property', key: 'og:type' }, type],
    [{ attr: 'property', key: 'og:image' }, image],
    [{ attr: 'name', key: 'twitter:title' }, fullTitle],
    [{ attr: 'name', key: 'twitter:description' }, description],
    [{ attr: 'name', key: 'twitter:image' }, image],
  ]);

  return (
    <>
      <title>{fullTitle}</title>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
    </>
  );
};
