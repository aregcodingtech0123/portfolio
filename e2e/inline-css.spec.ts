import { expect, seedTheme, test, type Mode, type Skin } from "./fixtures";

// The stylesheet is inlined into the HTML (experimental.inlineCss) instead of
// being a separate render-blocking request. These pin what that must not
// break: the page is styled from the first response, before any script or
// font has arrived, in every skin and mode.

const COMBOS: Array<{ skin: Skin; mode: Mode }> = [
  { skin: "terminal", mode: "dark" },
  { skin: "terminal", mode: "light" },
  { skin: "minimal", mode: "dark" },
  { skin: "minimal", mode: "light" },
];

test("the HTML carries its CSS inline and links no render-blocking stylesheet", async ({ request }) => {
  const html = await (await request.get("/en")).text();
  expect(html).toMatch(/<style[^>]*>[^<]{20000,}/); // the whole stylesheet, not a stub
  expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
});

for (const { skin, mode } of COMBOS) {
  test(`${skin}/${mode}: styled at first paint, with every script and font held back`, async ({ page }) => {
    await seedTheme(page, { skin, mode });
    // Hold every script and font for 3 s: whatever is on screen before they
    // arrive has to come from the HTML and its inline CSS alone.
    await page.route(/\/_next\/static\/(chunks\/.*\.js|media\/.*\.woff2)/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue();
    });
    await page.goto("/en", { waitUntil: "commit" });
    await page.locator("h1:visible").first().waitFor();

    const state = await page.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      const h1 = [...document.querySelectorAll("h1")].find((el) => el.getClientRects().length > 0)!;
      const cs = getComputedStyle(h1);
      const [r, g, b] = bg.match(/\d+/g)!.map(Number);
      return {
        scripts: performance.getEntriesByType("resource").filter((e) => /\.js(\?|$)/.test(e.name) && (e as PerformanceResourceTiming).responseEnd > 0).length,
        skin: document.documentElement.dataset.skin,
        dark: document.documentElement.classList.contains("dark"),
        luminance: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
        h1Size: parseFloat(cs.fontSize),
        h1Visible: cs.visibility === "visible" && cs.display !== "none",
      };
    });

    expect(state.scripts, "no script may have finished yet, or this proves nothing").toBe(0);
    expect(state.skin).toBe(skin);
    expect(state.dark).toBe(mode === "dark");
    // Page background follows the mode, not the browser default white.
    if (mode === "dark") expect(state.luminance).toBeLessThan(0.2);
    else expect(state.luminance).toBeGreaterThan(0.8);
    expect(state.h1Size).toBeGreaterThan(24); // heading size comes from the CSS
    expect(state.h1Visible).toBe(true);
  });
}
