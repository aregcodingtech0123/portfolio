import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots", () => {
  it("allows every crawler and points at the absolute sitemap on the site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.dev");
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://example.dev/sitemap.xml",
    });
  });

  it("disallows nothing, so the Studio's noindex stays visible to crawlers", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.dev");
    expect(JSON.stringify(robots())).not.toMatch(/disallow/i);
  });
});

describe("sitemap", () => {
  it("lists both home pages with en, tr and x-default alternates, absolute, without lastmod", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.dev");
    const languages = {
      en: "https://example.dev/en",
      tr: "https://example.dev/tr",
      "x-default": "https://example.dev/",
    };
    expect(sitemap()).toEqual([
      { url: "https://example.dev/en", alternates: { languages } },
      { url: "https://example.dev/tr", alternates: { languages } },
    ]);
  });
});
