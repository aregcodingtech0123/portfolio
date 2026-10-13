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

type GraphNode = Record<string, unknown> & { "@type": string };

function jsonLdBlocks(html: string): string[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, body]) => body);
}

function personOf(blocks: string[]): GraphNode {
  const graph = (JSON.parse(blocks[0]) as { "@graph": GraphNode[] })["@graph"];
  const person = graph.find((node) => node["@type"] === "Person");
  if (!person) throw new Error("no Person in the JSON-LD graph");
  return person;
}

test.describe("structured data (JSON-LD)", () => {
  for (const locale of LOCALES) {
    test(`/${locale}: exactly one escaped, valid block with WebSite, ProfilePage and Person`, async ({ request, baseURL }) => {
      const origin = site(baseURL);
      const html = await (await request.get(`/${locale}`)).text();
      const blocks = jsonLdBlocks(html);
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).not.toContain("<");

      const data = JSON.parse(blocks[0]) as { "@context": string; "@graph": GraphNode[] };
      expect(data["@context"]).toBe("https://schema.org");
      expect(data["@graph"].map((node) => node["@type"])).toEqual(["WebSite", "ProfilePage", "Person"]);

      const person = personOf(blocks);
      expect(person.jobTitle).toBe(EXPECTED[locale].title.split(" | ")[1]);
      expect(person.url).toBe(`${origin}/`);
      expect(person.image).toBe(`${origin}/images/profilephoto.jpeg`);
      for (const forbidden of ["worksFor", "email", "telephone", "birthDate"]) {
        expect(person).not.toHaveProperty(forbidden);
      }
      for (const forbidden of ["FAQPage", "Review", "AggregateRating", "SearchAction", "Event", "SoftwareSourceCode"]) {
        expect(blocks[0]).not.toContain(`"${forbidden}"`);
      }
    });

    test(`/${locale}: the Person matches what the page visibly shows, with no CSP violation`, async ({ page }) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __cspViolations: string[] };
        w.__cspViolations = [];
        document.addEventListener("securitypolicyviolation", (e) => {
          w.__cspViolations.push(`${e.effectiveDirective} ${e.blockedURI}`);
        });
      });
      const res = await page.goto(`/${locale}`);
      const blocks = jsonLdBlocks(await res!.text());
      const person = personOf(blocks);

      // Name = the visible h1 (one per skin; the other skin's is hidden).
      await expect(page.locator("h1:visible")).toHaveText(person.name as string);

      // sameAs: only links the visitor can see on the page.
      const visibleHrefs = await page
        .locator("a[href^='http']:visible")
        .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
      for (const url of person.sameAs as string[]) {
        expect(visibleHrefs).toContain(url);
      }

      // description, location, alumniOf and knowsAbout: visible text, the
      // project dialogs included (the full technology list is shown there).
      let text = await page.locator("body").innerText();
      const titles = page.locator("#projects h3 button:visible");
      const count = await titles.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await titles.nth(i).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        text += `\n${await dialog.innerText()}`;
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
      }
      const visible = text.replace(/\s+/g, " ");
      expect(visible).toContain(person.description as string);
      expect(visible).toContain((person.homeLocation as { name: string }).name);
      for (const school of person.alumniOf as { name: string }[]) {
        expect(visible).toContain(school.name);
      }
      for (const topic of person.knowsAbout as string[]) {
        expect(visible, `knowsAbout "${topic}" is not visible on the page`).toContain(topic);
      }

      const violations = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
      expect(violations).toEqual([]);
    });
  }
});

/** md5 of create-next-app's stock favicon.ico (the Vercel triangle). */
const STOCK_FAVICON_MD5 = "c30c7d42707a47a3f4591831641e50dc";

function pngSize(png: Buffer): { width: number; height: number } {
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test.describe("icons", () => {
  test("/favicon.ico is the owner's icon, not the stock file, with 16, 32 and 48 px frames", async ({ request }) => {
    const res = await request.get("/favicon.ico");
    expect(res.status()).toBe(200);
    const ico = await res.body();
    const { createHash } = await import("node:crypto");
    expect(createHash("md5").update(ico).digest("hex")).not.toBe(STOCK_FAVICON_MD5);
    expect(ico.readUInt16LE(2)).toBe(1); // ICO type
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + 16 * i]);
    expect(sizes).toEqual([16, 32, 48]);
  });

  test("every page links the favicon and a 180 px apple-touch-icon", async ({ request }) => {
    for (const locale of LOCALES) {
      const html = await (await request.get(`/${locale}`)).text();
      const links = tags(html, "link");
      expect(links.some((l) => l.rel === "icon" && l.href.startsWith("/favicon.ico"))).toBe(true);
      const apple = links.find((l) => l.rel === "apple-touch-icon");
      expect(apple, "apple-touch-icon link").toBeTruthy();
      const res = await request.get(decode(apple!.href));
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("image/png");
      expect(pngSize(await res.body())).toEqual({ width: 180, height: 180 });
    }
  });
});

test.describe("preview image", () => {
  for (const locale of LOCALES) {
    test(`/${locale}: og:image and twitter:image are the absolute 1200x630 PNG, large card`, async ({ request, baseURL }) => {
      const origin = site(baseURL);
      const html = await (await request.get(`/${locale}`)).text();
      const url = `${origin}/images/og-image.png`;

      expect(metas(html, "og:image")).toEqual([url]);
      expect(metas(html, "og:image:width")).toEqual(["1200"]);
      expect(metas(html, "og:image:height")).toEqual(["630"]);
      expect(metas(html, "og:image:alt")).toEqual([EXPECTED[locale].title]);
      expect(metas(html, "twitter:card")).toEqual(["summary_large_image"]);
      expect(metas(html, "twitter:image")).toEqual([url]);

      const res = await request.get("/images/og-image.png");
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("image/png");
      expect(pngSize(await res.body())).toEqual({ width: 1200, height: 630 });
    });
  }
});

test.describe("locale hygiene", () => {
  test("/tr shows no English UI string or untranslated university name in the indexable text", async ({ page }) => {
    await page.goto("/tr");
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("entries listed");
    expect(text).toContain("kayıt listelendi");
    expect(text).not.toContain("Ankara Science University");
    // The raw HTML too, since crawlers read both skins' markup.
    const html = await (await page.request.get("/tr")).text();
    expect(html).not.toMatch(/entries listed|Ankara Science University/);
  });

  test("/en keeps its own wording, pluralized", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("#skills")).toContainText("5 entries listed");
    await expect(page.locator("#skills")).toContainText("3 entries listed");
  });
});

test.describe("crawlable language links", () => {
  for (const [locale, other] of [
    ["en", "tr"],
    ["tr", "en"],
  ] as const) {
    test(`/${locale} links to /${other} with a real <a href hreflang> in the HTML`, async ({ request }) => {
      const html = await (await request.get(`/${locale}`)).text();
      const links = tags(html, "a").filter((a) => a.href === `/${other}`);
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.hreflang).toBe(other);
        expect(link.role).toBe("option");
      }
    });
  }

  test("a plain click still switches in place and keeps the hash", async ({ page }) => {
    await page.goto("/en#skills");
    await page.getByRole("button", { name: "Language English EN", exact: true }).first().click();
    await page.getByRole("option", { name: "Türkçe TR", exact: true }).first().click();
    await expect(page).toHaveURL(/\/tr#skills$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  });
});
