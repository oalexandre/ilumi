import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light";

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    window.numi.getTheme().then(setTheme);
    const cleanup = window.numi.onThemeChanged(setTheme);
    return cleanup;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    window.numi.toggleTheme().then(setTheme);
  }, []);

  return { theme, toggle };
}
