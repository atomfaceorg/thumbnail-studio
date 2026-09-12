export type Theme = "light" | "dark";

const STORAGE_KEY = "thumbnail-studio:theme";

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Only stamps the attribute when the user has made an explicit choice;
// leaving it unset lets the CSS `prefers-color-scheme` media query track
// the OS setting live.
export function applyExplicitTheme(theme: Theme | null) {
  const root = document.documentElement;
  if (theme) root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
}
