export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY =
  'function-base-theme';

function readSavedTheme(): AppTheme | null {
  try {
    const saved = localStorage.getItem(
      THEME_STORAGE_KEY,
    );

    return saved === 'light' ||
      saved === 'dark'
      ? saved
      : null;
  } catch {
    return null;
  }
}

function preferredTheme(): AppTheme {
  return window.matchMedia?.(
    '(prefers-color-scheme: dark)',
  ).matches
    ? 'dark'
    : 'light';
}

export function getCurrentTheme(): AppTheme {
  const current =
    document.documentElement.dataset.theme;

  if (
    current === 'light' ||
    current === 'dark'
  ) {
    return current;
  }

  return readSavedTheme() ??
    preferredTheme();
}

export function applyTheme(
  theme: AppTheme,
  persist = true,
) {
  document.documentElement.dataset.theme =
    theme;
  document.documentElement.style.colorScheme =
    theme;

  if (!persist) {
    return;
  }

  try {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    );
  } catch {
    // Theme still works when storage is unavailable.
  }
}

export function initializeTheme() {
  applyTheme(
    readSavedTheme() ?? preferredTheme(),
    false,
  );
}
