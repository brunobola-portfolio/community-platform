/** Minimal shape shared by the admin form list and the full SponsorTier record. */
export interface TierLike {
  id: string;
  name: string;
}

/**
 * Sponsors store the tier id, but records seeded or edited before the admin
 * form settled on ids may hold the display name instead. Both resolve here so
 * the backoffice and the public portal always show the same label.
 */
export function resolveSponsorTier<T extends TierLike>(tiers: T[], value?: string): T | undefined {
  if (!value) return undefined;
  const needle = value.trim().toLowerCase();
  return (
    tiers.find(tier => String(tier.id).toLowerCase() === needle) ??
    tiers.find(tier => tier.name.toLowerCase() === needle)
  );
}

/** Display label for a stored tier value, falling back to the raw value. */
export function sponsorTierLabel(tiers: TierLike[], value?: string): string {
  return resolveSponsorTier(tiers, value)?.name ?? value ?? '—';
}
