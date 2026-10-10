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
import {
  MODE_KEY,
  SKIN_KEY,
  isMode,
  isSkin,
  readDevOverride,
  resolveStoredMode,
  resolveStoredSkin,
  systemMode,
  type Mode,
  type Skin,
} from "@/lib/theme";

type ThemeContextValue = {
  /** Undefined until mounted, so server and client markup match. */
  mode: Mode | undefined;
  setMode: (mode: Mode) => void;
  skin: Skin | undefined;
  setSkin: (skin: Skin) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(mode: Mode, skin: Skin) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  root.style.colorScheme = mode;
  root.dataset.skin = skin;
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice still applies for this page view */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode | undefined>(undefined);
  const [skin, setSkinState] = useState<Skin | undefined>(undefined);

  useEffect(() => {
    const dev = readDevOverride();
    const nextMode = dev.mode ?? resolveStoredMode() ?? systemMode();
    const nextSkin = dev.skin ?? resolveStoredSkin() ?? "terminal";
    applyTheme(nextMode, nextSkin);
    // Deferred like ThemeToggle, so the state write does not run synchronously in the effect.
    queueMicrotask(() => {
      setModeState(nextMode);
      setSkinState(nextSkin);
    });
  }, []);

  // Paints the mode without persisting it. The OS-follow path uses this, so a
  // system-derived value is never stored as if the visitor had chosen it.
  const paintMode = useCallback((next: Mode) => {
    setModeState(next);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.style.colorScheme = next;
  }, []);

  const setMode = useCallback(
    (next: Mode) => {
      writeStorage(MODE_KEY, next);
      paintMode(next);
    },
    [paintMode],
  );

  const paintSkin = useCallback((next: Skin) => {
    setSkinState(next);
    document.documentElement.dataset.skin = next;
  }, []);

  const setSkin = useCallback(
    (next: Skin) => {
      writeStorage(SKIN_KEY, next);
      paintSkin(next);
    },
    [paintSkin],
  );

  useEffect(() => {
    // Keep tabs in sync. Also follow the OS mode while the visitor has not chosen one.
    const onStorage = (e: StorageEvent) => {
      if (e.key === MODE_KEY && isMode(e.newValue)) paintMode(e.newValue);
      if (e.key === SKIN_KEY && isSkin(e.newValue)) paintSkin(e.newValue);
    };
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (resolveStoredMode() === undefined) paintMode(systemMode());
    };
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", onSystem);
    return () => {
      window.removeEventListener("storage", onStorage);
      media.removeEventListener("change", onSystem);
    };
  }, [paintMode, paintSkin]);

  const value = useMemo(
    () => ({ mode, setMode, skin, setSkin }),
    [mode, setMode, skin, setSkin],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Single hook for both axes: `{ skin, setSkin, mode, setMode }`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
