import { useCallback, useEffect, useState } from "react";
import { applyTheme, DEFAULT_THEME, getStoredTheme, storeTheme, type Theme } from "./theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // stamp synchronously during the initial render (before paint) so an
    // OS dark-mode user never sees a flash of dark before this corrects it
    const initial = getStoredTheme() ?? DEFAULT_THEME;
    applyTheme(initial);
    return initial;
  });

  // always stamp an explicit attribute (even for the default) so it wins
  // over the OS's prefers-color-scheme regardless of the user's system setting
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      storeTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
