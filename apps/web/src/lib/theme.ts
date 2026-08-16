/**
 * lib/theme.ts
 * Applies the user's theme preference to the <html> element via data-theme attribute.
 * CSS variables for dark mode are driven by :root[data-theme="dark"] in index.css.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

export function applyTheme(preference: string | null | undefined): void {
  const root = document.documentElement;

  if (preference === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (preference === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    // 'system' or null/unknown — let prefers-color-scheme media query take over
    root.removeAttribute('data-theme');
  }
}

/** Returns the effective visual theme (resolves 'system' to 'light' | 'dark'). */
export function getEffectiveTheme(preference: string | null | undefined): 'light' | 'dark' {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
