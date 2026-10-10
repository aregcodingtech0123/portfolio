/**
 * Two-axis theme: `skin` (data-skin on <html>) and `mode` (dark/light class on <html>).
 * The boot script in app/layout.tsx and ThemeProvider both follow these rules, so the
 * first paint and the hydrated state always agree.
 */
export const MODE_KEY = "theme";
export const SKIN_KEY = "skin";

export const SKINS = ["terminal", "minimal"] as const;
export type Skin = (typeof SKINS)[number];
export type Mode = "light" | "dark";

export const DEFAULT_SKIN: Skin = "terminal";

export function isSkin(value: unknown): value is Skin {
  return value === "terminal" || value === "minimal";
}

export function isMode(value: unknown): value is Mode {
  return value === "light" || value === "dark";
}

/**
 * Dev-only override: `?skin=minimal&mode=light` on load. It is compiled out of production
 * builds by the NODE_ENV check, and it never writes to storage.
 */
export function readDevOverride(): { skin?: Skin; mode?: Mode } {
  if (process.env.NODE_ENV !== "development") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const skin = params.get("skin");
    const mode = params.get("mode");
    return {
      skin: isSkin(skin) ? skin : undefined,
      mode: isMode(mode) ? mode : undefined,
    };
  } catch {
    return {};
  }
}

/** Mirrors the inline boot script. Used by the provider when it reads initial state. */
export function resolveStoredMode(): Mode | undefined {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    if (isMode(raw)) return raw;
  } catch {
    /* storage blocked */
  }
  return undefined;
}

export function resolveStoredSkin(): Skin | undefined {
  try {
    const raw = localStorage.getItem(SKIN_KEY);
    if (isSkin(raw)) return raw;
  } catch {
    /* storage blocked */
  }
  return undefined;
}

export function systemMode(): Mode {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

/**
 * Inline script for <head>. It runs before first paint and sets both attributes.
 * Keep it in sync with resolveStoredMode, resolveStoredSkin and systemMode above.
 */
export function themeBootScript(devOverride: boolean): string {
  const dev = devOverride
    ? `var q=new URLSearchParams(location.search);var qm=q.get('mode'),qs=q.get('skin');if(qm==='light'||qm==='dark')mode=qm;if(qs==='terminal'||qs==='minimal')skin=qs;`
    : "";
  return `(()=>{try{var d=document.documentElement;var m=localStorage.getItem('${MODE_KEY}');var s=localStorage.getItem('${SKIN_KEY}');var mode=(m==='light'||m==='dark')?m:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var skin=(s==='minimal'||s==='terminal')?s:'${DEFAULT_SKIN}';${dev}d.classList.remove('light','dark');d.classList.add(mode);d.style.colorScheme=mode;d.dataset.skin=skin;}catch(e){}})();`;
}
