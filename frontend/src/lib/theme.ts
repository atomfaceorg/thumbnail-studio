export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "light";

const STORAGE_KEY = "thumbnail-studio:theme";

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
