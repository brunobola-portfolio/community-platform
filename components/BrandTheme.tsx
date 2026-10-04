import React, { useLayoutEffect } from 'react';
import { useData } from '../context/DataContext';
import { applyDocumentBrand, cacheBrand, resolveBrand } from '../utils/brandDom';

/**
 * Applies the instance brand (colour scales, accent, fonts, theme-color) to
 * the whole document. Mounted once above the router so the public site,
 * /admin and /setup all share it. Renders nothing.
 */
export const BrandTheme: React.FC = () => {
  const { settings, isLoading } = useData();
  const { brandColor, accentColor, fontHeading, fontBody, fontMono } = settings;

  // Layout effect: the variables land before the browser paints the first
  // frame that has real settings, so there is no visible colour swap
  useLayoutEffect(() => {
    // Until the query resolves, settings are the env defaults; applying them
    // would overwrite the cached brand of a returning visitor
    if (isLoading) return;
    const brand = resolveBrand({ color: brandColor, accent: accentColor, heading: fontHeading, body: fontBody, mono: fontMono });
    applyDocumentBrand(brand);
    cacheBrand(brand);
  }, [isLoading, brandColor, accentColor, fontHeading, fontBody, fontMono]);

  return null;
};
