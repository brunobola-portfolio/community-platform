/**
 * Security Utilities
 *
 * Provides HTML sanitization and input validation for preventing XSS attacks
 * and ensuring data integrity across the application.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify with a restrictive allowlist.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  });
}

/**
 * Sanitizes plain text (strips all HTML).
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Escapes HTML special characters to prevent injection in text contexts.
 * Use this for plain text that should not be interpreted as HTML.
 * 
 * @param text - Plain text to escape
 * @returns Escaped text safe for HTML insertion
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, char => map[char] || char);
}

/**
 * Validates and sanitizes a URL to prevent javascript: and data: injection.
 * 
 * @param url - URL string to validate
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous URL schemes
  if (trimmed.startsWith('javascript:') || 
      trimmed.startsWith('data:') || 
      trimmed.startsWith('vbscript:')) {
    return '';
  }
  
  // Allow relative URLs and safe schemes
  if (trimmed.startsWith('/') || 
      trimmed.startsWith('http://') || 
      trimmed.startsWith('https://') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:')) {
    return url;
  }
  
  // Bare domains without protocol are rejected for safety
  return '';
}

