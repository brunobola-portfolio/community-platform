/**
 * Centralized fallback image URLs and constants.
 */
/** Local asset: a hotlinked stock photo would leak every visit to a third party. */
const PLACEHOLDER = '/placeholder.jpg';

export const FALLBACK_IMAGES = {
  event: PLACEHOLDER,
  post: PLACEHOLDER,
  gallery: PLACEHOLDER,
  general: PLACEHOLDER,
  avatar: PLACEHOLDER,
  sponsor: PLACEHOLDER,
} as const;

export const SCROLL_CARD_WIDTH = 340;

export const PAGES = {
  HOME: 'home',
  ABOUT: 'about',
  EVENTS: 'events',
  BLOG: 'blog',
  GALLERY: 'gallery',
  MEMBER: 'member-area',
  ADMIN: 'admin',
} as const;

export type PageId = typeof PAGES[keyof typeof PAGES];

/** Standard icon sizes for consistent sizing across the app */
export const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;
