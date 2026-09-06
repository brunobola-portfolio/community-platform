import React from 'react';
import { useData } from '../context/DataContext';
import type { Event } from '../types';

/** Serialises JSON-LD without letting a "</script>" in content break out. */
const serialize = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

const JsonLd: React.FC<{ data: unknown }> = ({ data }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />
);

const siteUrl = () => (typeof window === 'undefined' ? '' : window.location.origin);

/** Organization schema, rendered once on the home page from the live settings. */
export const OrganizationJsonLd: React.FC = () => {
  const { settings } = useData();
  const sameAs = [
    settings.facebookPageId ? `https://www.facebook.com/${settings.facebookPageId}` : null,
    settings.instagramUrl || null,
  ].filter(Boolean);
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: settings.siteFullName || settings.siteName,
        alternateName: settings.siteName,
        url: siteUrl(),
        logo: settings.logoUrl ? new URL(settings.logoUrl, siteUrl()).toString() : undefined,
        email: settings.contactEmail || undefined,
        telephone: settings.phone || undefined,
        address: settings.address ? { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: settings.locality || undefined, addressCountry: 'PT' } : undefined,
        foundingDate: settings.foundedYear ? String(settings.foundedYear) : undefined,
        sameAs: sameAs.length ? sameAs : undefined,
      }}
    />
  );
};

/** Event schema for the published events listed on the page. */
export const EventsJsonLd: React.FC<{ events: Event[] }> = ({ events }) => {
  const { settings } = useData();
  if (events.length === 0) return null;
  return (
    <JsonLd
      data={events.slice(0, 20).map(event => ({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: event.location, address: settings.locality || undefined },
        image: event.imageUrl || undefined,
        description: event.description?.replace(/<[^>]+>/g, '').slice(0, 300) || undefined,
        organizer: { '@type': 'Organization', name: settings.siteFullName || settings.siteName, url: siteUrl() },
        offers: event.registrationOpen
          ? { '@type': 'Offer', price: event.entryPrice ?? 0, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: `${siteUrl()}/events` }
          : undefined,
      }))}
    />
  );
};

/** Per-article social tags; React 19 hoists these into the document head. */
export const ArticleMeta: React.FC<{ title: string; description?: string; image?: string; path: string }> = ({ title, description, image, path }) => {
  const url = `${siteUrl()}${path}`;
  return (
    <>
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:url" content={url} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      <link rel="canonical" href={url} />
    </>
  );
};
