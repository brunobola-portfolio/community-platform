import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'portal-theme';

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (private mode); fall through to default
  }
  return 'dark';
}

function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** True when the browser can cross-fade and the visitor has not asked for less motion. */
function canAnimateThemeSwitch(): boolean {
  return typeof document.startViewTransition === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Theme state synced with the `dark` class on <html> and localStorage.
 * The inline script in index.html applies the stored theme before first paint;
 * this hook keeps runtime toggling consistent with that bootstrap.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Persisting is best-effort
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // The class flips and React commits inside the transition callback, so the
    // browser snapshots the old page, then the fully re-rendered new one, and
    // cross-fades them: no frame shows a half-switched theme
    const commit = () => {
      applyThemeClass(next);
      flushSync(() => setTheme(next));
    };
    if (canAnimateThemeSwitch()) document.startViewTransition(commit);
    else commit();
  }, [theme]);

  return { theme, toggleTheme };
}
