import { describe, expect, it } from "vitest";
import { absoluteUrl, homeLanguageAlternates, OG_LOCALE, siteUrl } from "./site";

describe("siteUrl", () => {
  it("uses the configured origin", () => {
    expect(siteUrl("https://example.dev").toString()).toBe("https://example.dev/");
  });

  it("falls back to localhost when unset, empty or blank, instead of throwing", () => {
    for (const value of [undefined, "", "   "]) {
      expect(siteUrl(value).toString()).toBe("http://localhost:3000/");
    }
  });

  it("trims surrounding whitespace", () => {
    expect(siteUrl("  https://example.dev  ").host).toBe("example.dev");
  });
});

describe("absoluteUrl", () => {
  it("resolves a site path against the origin", () => {
    expect(absoluteUrl("/tr", new URL("https://example.dev"))).toBe("https://example.dev/tr");
  });
});

describe("homeLanguageAlternates", () => {
  it("lists every locale plus x-default on the bare root", () => {
    expect(homeLanguageAlternates()).toEqual({ en: "/en", tr: "/tr", "x-default": "/" });
  });
});

describe("OG_LOCALE", () => {
  it("maps each route locale to its Open Graph locale", () => {
    expect(OG_LOCALE).toEqual({ en: "en_US", tr: "tr_TR" });
  });
});
