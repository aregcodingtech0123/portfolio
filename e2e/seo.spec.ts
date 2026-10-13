import { expect, test } from "./fixtures";

/*
 * Search metadata as a crawler without JavaScript receives it: raw HTML and
 * headers from the production build, read with the request fixture (no
 * browser, no hydration). The e2e server runs with
 * NEXT_PUBLIC_SITE_URL = the suite's baseURL (playwright.config.ts), so every
 * absolute URL must start with it.
 */

const LOCALES = ["en", "tr"] as const;

type Tag = Record<string, string>;

/** Attributes of every <tagName ...> in the HTML, keys lower-cased (React writes hrefLang). */
function tags(html: string, tagName: string): Tag[] {
  return [...html.matchAll(new RegExp(`<${tagName}\\b([^>]*)>`, "gi"))].map(([, attrs]) =>
    Object.fromEntries(
      [...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), value]),
    ),
  );
}

function decode(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
}

/**
 * hreflang -> href, each href normalized with the URL parser: Next writes the
 * bare root as "https://host" (no slash), which is the same URL as
 * "https://host/". A relative href would throw here, failing the test.
 */
function hreflangs(html: string): Record<string, string> {
  return Object.fromEntries(
    tags(html, "link")
      .filter((t) => t.rel === "alternate" && t.hreflang)
      .map((t) => [t.hreflang, new URL(decode(t.href)).toString()]),
  );
}

function site(baseURL: string | undefined): string {
  if (!baseURL) throw new Error("playwright baseURL is not set");
  return baseURL.replace(/\/$/, "");
}

test.describe("hreflang", () => {
  for (const locale of LOCALES) {
    test(`/${locale} has en, tr and x-default as absolute URLs on the site URL, and no hreflang Link header`, async ({
      request,
      baseURL,
    }) => {
      const origin = site(baseURL);
      const res = await request.get(`/${locale}`);
      expect(res.status()).toBe(200);
      // One source only: the proxy's Link header (built from the request host) is off.
      expect(res.headers()["link"] ?? "").not.toMatch(/hreflang/i);

      const html = await res.text();
      expect(hreflangs(html)).toEqual({
        en: `${origin}/en`,
        tr: `${origin}/tr`,
        "x-default": `${origin}/`,
      });
      const canonical = tags(html, "link").find((t) => t.rel === "canonical");
      expect(canonical?.href).toBe(`${origin}/${locale}`);
    });
  }

  test("the locales are reciprocal: each lists the other and itself with the same URLs", async ({ request }) => {
    const [en, tr] = await Promise.all(LOCALES.map(async (l) => hreflangs(await (await request.get(`/${l}`)).text())));
    expect(en).toEqual(tr);
  });
});
