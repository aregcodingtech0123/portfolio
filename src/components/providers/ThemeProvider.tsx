"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme | undefined;
  resolvedTheme: Theme | undefined;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

function applyThemeClass(resolved: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme | undefined>(
    undefined,
  );

  useEffect(() => {
    const next = readStoredTheme();
    setResolvedTheme(next);
    applyThemeClass(next);
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    setResolvedTheme(theme);
    applyThemeClass(theme);
  }, []);

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme],
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const t = e.newValue;
      if (t === "light" || t === "dark") {
        setResolvedTheme(t);
        applyThemeClass(t);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
