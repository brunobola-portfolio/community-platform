/**
 * Centralized fallback image URLs and constants.
 */
export const FALLBACK_IMAGES = {
  event: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
  post: 'https://images.unsplash.com/photo-1495020689067-958852a7735e?w=800&q=80',
  gallery: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  general: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  sponsor: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop',
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
