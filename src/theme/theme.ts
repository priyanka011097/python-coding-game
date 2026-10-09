/* =====================================================================
   theme.ts — light / dark mode.

   Until the user picks one, the app follows the operating system's
   setting (and changes with it). Picking one stores it for this device.
   index.html applies the same logic in a tiny inline script before the
   app loads, so the page never flashes the wrong theme.
   ===================================================================== */

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

/** Per-device preference, deliberately not synced to the account. */
export const THEME_KEY = "interview-prep-theme";

const systemTheme = (): Theme =>
  window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";

function storedTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  // Colours the phone's status bar / browser chrome to match the page.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#F5F6F8" : "#000000");
}

export interface UseTheme {
  theme: Theme;
  toggle: () => void;
}

export function useTheme(): UseTheme {
  const [choice, setChoice] = useState<Theme | null>(storedTheme);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = choice ?? system;

  // Follow the OS while the user has not chosen.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const onChange = (): void => setSystem(mq.matches ? "light" : "dark");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => apply(theme), [theme]);

  const toggle = useCallback((): void => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setChoice(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private browsing — still switches for this visit */
    }
  }, [theme]);

  return { theme, toggle };
}
