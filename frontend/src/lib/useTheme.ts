import { useCallback, useEffect, useState } from "react";
import { applyExplicitTheme, getStoredTheme, getSystemTheme, storeTheme, type Theme } from "./theme";

export function useTheme() {
  const [explicitTheme, setExplicitTheme] = useState<Theme | null>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<Theme>(() => getSystemTheme());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    applyExplicitTheme(explicitTheme);
  }, [explicitTheme]);

  const toggleTheme = useCallback(() => {
    setExplicitTheme((prev) => {
      const next: Theme = (prev ?? getSystemTheme()) === "dark" ? "light" : "dark";
      storeTheme(next);
      return next;
    });
  }, []);

  return { theme: explicitTheme ?? systemTheme, toggleTheme };
}
