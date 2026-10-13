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

/** Every content of meta tags with this property or name, in document order. */
function metas(html: string, key: string): string[] {
  return tags(html, "meta")
    .filter((t) => t.property === key || t.name === key)
    .map((t) => decode(t.content ?? ""));
}

function title(html: string): string {
  // The document <title> is the first one; inline SVG icons carry their own.
  return decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
}

const EXPECTED = {
  en: { title: "Arda Ege Tunç | Computer Engineer", ogLocale: "en_US", ogAlternate: "tr_TR" },
  tr: { title: "Arda Ege Tunç | Bilgisayar Mühendisi", ogLocale: "tr_TR", ogAlternate: "en_US" },
} as const;

test.describe("page metadata", () => {
  for (const locale of LOCALES) {
    test(`/${locale}: localized title, one description, per-locale Open Graph`, async ({ request, baseURL }) => {
      const origin = site(baseURL);
      const html = await (await request.get(`/${locale}`)).text();
      const expected = EXPECTED[locale];

      expect(title(html)).toBe(expected.title);
      const descriptions = metas(html, "description");
      expect(descriptions).toHaveLength(1);
      expect(descriptions[0].length).toBeGreaterThan(0);

      expect(metas(html, "og:title")).toEqual([expected.title]);
      expect(metas(html, "og:description")).toEqual(descriptions);
      expect(metas(html, "og:locale")).toEqual([expected.ogLocale]);
      expect(metas(html, "og:locale:alternate")).toEqual([expected.ogAlternate]);
      expect(metas(html, "og:url")).toEqual([`${origin}/${locale}`]);
      expect(metas(html, "og:site_name")).toEqual(["Arda Ege Tunç"]);
      expect(metas(html, "og:type")).toEqual(["website"]);
      expect(metas(html, "twitter:title")).toEqual([expected.title]);
    });
  }
});

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

test.describe("robots.txt", () => {
  test("is served directly (not redirected by the locale proxy), allows everything and names the absolute sitemap", async ({
    request,
    baseURL,
  }) => {
    const origin = site(baseURL);
    const res = await request.get("/robots.txt", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/^text\/plain/);
    const lines = (await res.text()).split("\n").map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(["User-Agent: *", "Allow: /", `Sitemap: ${origin}/sitemap.xml`]);
    // The Studio is not blocked here: its noindex must stay visible to crawlers.
    expect(lines.join("\n")).not.toMatch(/disallow/i);
  });

  test("the Studio keeps its noindex", async ({ request }) => {
    const html = await (await request.get("/content-hub")).text();
    expect(metas(html, "robots")).toEqual(["noindex, nofollow"]);
  });
});

test.describe("sitemap.xml", () => {
  test("lists /en and /tr with en, tr and x-default alternates, no lastmod and no ?project= URLs", async ({
    request,
    baseURL,
  }) => {
    const origin = site(baseURL);
    const res = await request.get("/sitemap.xml", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/xml/);
    const xml = await res.text();

    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, loc]) => loc);
    expect(locs).toEqual([`${origin}/en`, `${origin}/tr`]);

    const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => body);
    for (const body of urls) {
      const alternates = Object.fromEntries(
        [...body.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*\/>/g)].map(
          ([, lang, href]) => [lang, new URL(href).toString()],
        ),
      );
      expect(alternates).toEqual({ en: `${origin}/en`, tr: `${origin}/tr`, "x-default": `${origin}/` });
    }
    expect(xml).not.toContain("<lastmod>");
    expect(xml).not.toContain("project=");
  });
});
