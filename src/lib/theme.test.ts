import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SKIN,
  MODE_KEY,
  SKIN_KEY,
  SKINS,
  isMode,
  isSkin,
  resolveStoredMode,
  resolveStoredSkin,
  systemMode,
  themeBootScript,
} from "@/lib/theme";

describe("isSkin / isMode", () => {
  it("accepts only the real skin values", () => {
    expect(isSkin("terminal")).toBe(true);
    expect(isSkin("minimal")).toBe(true);
    expect(isSkin("neon")).toBe(false);
    expect(isSkin(undefined)).toBe(false);
  });

  it("accepts only the real mode values", () => {
    expect(isMode("light")).toBe(true);
    expect(isMode("dark")).toBe(true);
    expect(isMode("sepia")).toBe(false);
    expect(isMode(null)).toBe(false);
  });
});

describe("resolveStoredMode", () => {
  it("returns the stored value when it is valid", () => {
    localStorage.setItem(MODE_KEY, "light");
    expect(resolveStoredMode()).toBe("light");
  });

  it("returns undefined for a corrupted stored value", () => {
    localStorage.setItem(MODE_KEY, "sepia");
    expect(resolveStoredMode()).toBeUndefined();
  });

  it("returns undefined when nothing is stored", () => {
    expect(resolveStoredMode()).toBeUndefined();
  });
});

describe("resolveStoredSkin", () => {
  it("returns the stored value when it is valid", () => {
    localStorage.setItem(SKIN_KEY, "minimal");
    expect(resolveStoredSkin()).toBe("minimal");
  });

  it("returns undefined for a corrupted stored value", () => {
    localStorage.setItem(SKIN_KEY, "neon");
    expect(resolveStoredSkin()).toBeUndefined();
  });

  it("returns undefined when nothing is stored", () => {
    expect(resolveStoredSkin()).toBeUndefined();
  });
});

describe("systemMode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports light when the media query matches", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    expect(systemMode()).toBe("light");
  });

  it("falls back to the system preference's dark branch when it does not match", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    expect(systemMode()).toBe("dark");
  });

  it("falls back to dark if matchMedia itself throws", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(() => {
      throw new Error("matchMedia unavailable");
    });
    expect(systemMode()).toBe("dark");
  });
});

// themeBootScript is a hand-written inline <script> string that must stay in
// sync with the TS helpers above by hand. These checks only confirm the
// string still *mentions* the same storage keys and valid values -- they
// cannot execute the script in a real document or verify it actually sets
// data-skin/classList correctly before paint. Only a real browser test
// (the Playwright layer, not written yet) can verify the boot behavior
// itself; treat this as a weak tripwire against obvious drift, not proof
// the boot script works.
describe("themeBootScript (weak structural check only)", () => {
  it("mentions every real skin value from SKINS, and the real DEFAULT_SKIN", () => {
    const script = themeBootScript(false);
    for (const skin of SKINS) {
      expect(script).toContain(`'${skin}'`);
    }
    expect(script).toContain(`'${DEFAULT_SKIN}'`);
  });

  it("mentions both real mode values", () => {
    const script = themeBootScript(false);
    expect(script).toContain("'light'");
    expect(script).toContain("'dark'");
  });

  it("reads from the same storage keys MODE_KEY/SKIN_KEY name", () => {
    const script = themeBootScript(false);
    expect(script).toContain(`localStorage.getItem('${MODE_KEY}')`);
    expect(script).toContain(`localStorage.getItem('${SKIN_KEY}')`);
  });

  it("only inlines the dev query-param override block when devOverride is true", () => {
    expect(themeBootScript(false)).not.toContain("URLSearchParams");
    expect(themeBootScript(true)).toContain("URLSearchParams");
  });
});
