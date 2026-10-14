import type { Locator } from "@playwright/test";
import { expect, seedTheme, test } from "./fixtures";

/*
 * Off-screen sections skip rendering (content-visibility: auto, globals.css):
 * every web font that arrives after first paint makes the browser lay the
 * document out again, and on a throttled phone those relayouts were the long
 * tasks that pushed mobile Total Blocking Time over budget. This pins the rule
 * and checks the guarantees it must keep: the content is in the page, reachable
 * by anchor, and renders as a visitor scrolls to it.
 */

/**
 * Whether a section's headings are rendered right now. Only headings the
 * active skin shows count (the other skin's are display: none); for those,
 * checkVisibility({ contentVisibilityAuto: true }) is false while the
 * section is skipped by content-visibility: auto.
 */
function headingsRendered(section: Locator): Promise<boolean | null> {
  return section.evaluate((n) => {
    const shown = [...n.querySelectorAll("h2")].filter((h) => h.checkVisibility());
    if (shown.length === 0) return null;
    return shown.every((h) => h.checkVisibility({ contentVisibilityAuto: true }));
  });
}

for (const skin of ["terminal", "minimal"] as const) {
  test(`${skin}: content sections skip off-screen rendering, the hero never does`, async ({ page }) => {
    await seedTheme(page, { skin, mode: "dark" });
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("data-skin", skin);

    const sections = await page.locator("main > section").evaluateAll((nodes) =>
      nodes.map((n) => ({ id: n.id, cv: getComputedStyle(n).contentVisibility })),
    );
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) expect(section, section.id).toMatchObject({ cv: "auto" });
    await expect(page.locator("#home")).toHaveCSS("content-visibility", "visible");
  });

  test(`${skin}: a section far below the fold is skipped at load, and renders once scrolled to`, async ({ page }) => {
    await seedTheme(page, { skin, mode: "dark" });
    await page.setViewportSize({ width: 412, height: 823 });
    await page.goto("/en");
    const last = page.locator("main > section").last();
    // At load: the rule is doing its job.
    expect(await headingsRendered(last)).toBe(false);

    const ids = await page.locator("main > section").evaluateAll((nodes) => nodes.map((n) => n.id));
    for (const id of ids) {
      const section = page.locator(`main > section#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect.poll(() => headingsRendered(section), { message: `${id} renders when scrolled to` }).toBe(true);
    }
  });
}

test("an anchor to the last section lands on it, past sections that never rendered", async ({ page }) => {
  await page.goto("/en#contact");
  await expect(page.locator("#contact")).toBeInViewport();
  await expect.poll(() => headingsRendered(page.locator("#contact"))).toBe(true);
});
