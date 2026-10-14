import type { Page } from "@playwright/test";
import { expect, seedTheme, test } from "./fixtures";

/*
 * Web fonts swap in after first paint (display: swap). next/font's fallback
 * faces make the fallback take the web font's space, but they are built on
 * local Arial / Times New Roman, which Linux does not have: on the CI runner
 * the mobile minimal hero subline rendered a line taller in DejaVu Sans and
 * the swap moved everything below it (CLS 0.0104). globals.css adds Linux
 * twins after each family. These pin both the CSS and the behaviour.
 */

type Face = Record<string, string>;

/** The @font-face rules of the inlined CSS, keyed by family name (quotes stripped). */
async function fontFaces(page: Page): Promise<Map<string, Face>> {
  const html = await (await page.request.get("/en")).text();
  const faces = new Map<string, Face>();
  for (const [, body] of html.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const face: Face = {};
    for (const decl of body.split(";")) {
      const i = decl.indexOf(":");
      if (i > 0) face[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    }
    const family = (face["font-family"] ?? "").replace(/\\?["']/g, "");
    if (family.endsWith("Fallback") || family.endsWith("Fallback Linux")) faces.set(family, face);
  }
  return faces;
}

const pct = (value: string | undefined) => Number.parseFloat(value ?? "NaN");

test.describe("Linux fallback faces", () => {
  for (const [family, twinSource] of [
    ["Inter", "Liberation Sans"],
    ["Bricolage Grotesque", "Liberation Sans"],
    ["Source Serif 4", "Liberation Serif"],
  ] as const) {
    test(`${family}: the Linux twin uses next/font's exact overrides on ${twinSource}`, async ({ page }) => {
      const faces = await fontFaces(page);
      const nextFace = faces.get(`${family} Fallback`);
      const twin = faces.get(`${family} Fallback Linux`);
      expect(nextFace, `next/font's "${family} Fallback" face`).toBeTruthy();
      expect(twin, `"${family} Fallback Linux" face`).toBeTruthy();
      expect(twin!.src).toContain(twinSource);
      for (const d of ["ascent-override", "descent-override", "line-gap-override", "size-adjust"]) {
        expect(pct(twin![d]), d).toBeCloseTo(pct(nextFace![d]), 2);
      }
    });
  }

  test("JetBrains Mono: the Linux twin is a monospace face with JetBrains' metrics", async ({ page }) => {
    const faces = await fontFaces(page);
    const nextFace = faces.get("JetBrains Mono Fallback")!;
    const twin = faces.get("JetBrains Mono Fallback Linux");
    expect(twin, '"JetBrains Mono Fallback Linux" face').toBeTruthy();
    expect(twin!.src).toContain("Liberation Mono");
    // Same 0.6em advance as JetBrains Mono: no scaling. Vertical metrics are
    // the ones next/font derived (its override x its size-adjust).
    expect(pct(twin!["size-adjust"])).toBe(100);
    const scale = pct(nextFace["size-adjust"]) / 100;
    expect(pct(twin!["ascent-override"])).toBeCloseTo(pct(nextFace["ascent-override"]) * scale, 0);
    expect(pct(twin!["descent-override"])).toBeCloseTo(pct(nextFace["descent-override"]) * scale, 0);
  });

  test("every font stack lists the Linux twin right after its family", async ({ page }) => {
    const html = await (await page.request.get("/en")).text();
    const twins: Record<string, string> = {
      inter: "Inter Fallback Linux",
      jetbrains: "JetBrains Mono Fallback Linux",
      bricolage: "Bricolage Grotesque Fallback Linux",
      "source-serif": "Source Serif 4 Fallback Linux",
    };
    const uses = [...html.matchAll(/var\(--font-(inter|jetbrains|bricolage|source-serif)\)\s*,\s*\\?["']?([^,"'\\;}]+)/g)];
    expect(uses.length).toBeGreaterThan(10);
    for (const [, name, next] of uses) {
      expect(next.trim(), `var(--font-${name}) is followed by its Linux twin`).toBe(twins[name]);
    }
  });
});

/** Heights of the visible hero text column's children. */
async function heroHeights(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const h1 = [...document.querySelectorAll("#home h1")].find((h) => h.checkVisibility())!;
    return [...h1.parentElement!.children]
      .filter((c) => c.checkVisibility())
      .map((c) => Math.round(c.getBoundingClientRect().height));
  });
}

for (const skin of ["minimal", "terminal"] as const) {
  for (const locale of ["en", "tr"] as const) {
    test(`${skin} ${locale}, phone width: the hero text takes the same space before and after the web fonts`, async ({
      browser,
      baseURL,
    }) => {
      const measure = async (blockFonts: boolean) => {
        const context = await browser.newContext({ baseURL, viewport: { width: 412, height: 823 }, isMobile: true, reducedMotion: "reduce" });
        const page = await context.newPage();
        await seedTheme(page, { skin, mode: "dark" });
        if (blockFonts) await page.route("**/*.woff2", (route) => route.abort());
        await page.goto(`/${locale}`, { waitUntil: "load" });
        // Resolves once every font face has loaded or (blocked) failed.
        await page.evaluate(() => document.fonts.ready);
        const heights = await heroHeights(page);
        await context.close();
        return heights;
      };
      const fallback = await measure(true);
      const webFonts = await measure(false);
      expect(fallback, "hero text heights with fallback fonts only vs with the web fonts").toEqual(webFonts);
    });
  }
}
