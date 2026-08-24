/**
 * Date formatting utilities for Portuguese locale (pt-PT).
 */

/**
 * Format a date string/Date in Portuguese locale.
 */
export function formatDatePT(
  date: string | Date,
  format: 'full' | 'short' | 'month-year' = 'full'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Data inválida';

  switch (format) {
    case 'full':
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    case 'short':
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    case 'month-year':
      return d.toLocaleDateString('pt-PT', {
        month: 'long',
        year: 'numeric',
      });
  }
}

/**
 * Format a relative date string (e.g., "há 2 dias").
 */
export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  return formatDatePT(d, 'short');
}

/**
 * Check if a date is in the future.
 */
export function isUpcoming(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
}

/**
 * Check if a date is in the past.
 */
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Get the month name from a date string.
 */
export function getMonthName(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-PT', { month: 'long' });
}

/**
 * Get the day number from a date string.
 */
export function getDayNumber(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDate();
}
