import { expect, seedTheme, test, type Skin } from "./fixtures";

// These guard a release blocker: content that a user preference or a
// missing/slow script can leave permanently invisible. They deliberately
// do NOT use any force-reveal helper -- they look at the page exactly as a
// real visitor would, so if the entrance animation ever hides content
// again, these fail.

/**
 * Scrolls through the whole page one viewport at a time (no scripted
 * reveal) and returns, for every section, its id and the computed opacity
 * the browser actually painted.
 */
async function sectionOpacities(page: import("@playwright/test").Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize()!.height;
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("main section[id]")).map((el) => ({
      id: el.id,
      opacity: getComputedStyle(el).opacity,
    })),
  );
}

test.describe("reduced motion keeps every section visible", () => {
  test.use({ reducedMotion: "reduce" });

  for (const skin of ["terminal", "minimal"] as const satisfies Skin[]) {
    test(`every section renders at opacity 1 under prefers-reduced-motion (${skin})`, async ({
      page,
    }) => {
      await seedTheme(page, { skin });
      await page.goto("/en");
      const sections = await sectionOpacities(page);

      expect(sections.length).toBeGreaterThan(3);
      const hidden = sections.filter((s) => s.opacity !== "1");
      expect(
        hidden,
        `sections stuck below full opacity under reduced motion: ${hidden
          .map((s) => `#${s.id}=${s.opacity}`)
          .join(", ")}`,
      ).toEqual([]);

      // The headings must also be reachable, not just technically present.
      await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    });
  }
});

test.describe("content is visible without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every section reaches full opacity when scrolled to, with no page JS", async ({
    page,
  }) => {
    // The whole reveal is CSS (scroll-driven), so it needs no page script.
    // With page JS disabled, scrolling each section into view must still
    // bring it to full opacity -- content is never permanently hidden.
    // (Scrolling here stands in for the native scroll a real reader does;
    // the reveal itself runs no page JavaScript.)
    await page.goto("/en");
    const ids = await page.$$eval("main section[id]", (els) => els.map((el) => el.id));
    expect(ids.length).toBeGreaterThan(3);

    // Walk to the bottom a viewport at a time, the way a reader scrolls.
    // Each section's scroll-driven reveal fires as it passes through, and
    // holds at full opacity once scrolled beyond (animation-fill-mode:
    // both). At the document end every section has been entered, so all
    // must read opacity 1 -- none is left permanently hidden without JS.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = page.viewportSize()!.height;
    for (let y = step; y <= height; y += step) {
      await page.evaluate((top) => window.scrollTo({ top }), y);
      await page.waitForTimeout(80);
    }
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight }));
    await page.waitForTimeout(150);

    const opacities = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("main section[id]")).map((el) => ({
        id: el.id,
        opacity: getComputedStyle(el).opacity,
      })),
    );
    const hidden = opacities.filter((s) => Number(s.opacity) < 0.99);
    expect(
      hidden,
      `sections never reached full opacity while scrolling with no JS: ${hidden
        .map((s) => `#${s.id}=${s.opacity}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});
