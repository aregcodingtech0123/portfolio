import { expect, seedTheme, test, type Skin } from "./fixtures";

// The nav, hero and footer links point at sections of the page you are already
// on (/en#projects). They carry prefetch={false}: prefetching a link to the
// current route only downloads the current page again (about 24 KB of RSC
// payload per view, with the CSS inlined). Navigation must stay instant and
// must not need a network round trip.

for (const skin of ["terminal", "minimal"] as const satisfies Skin[]) {
  test(`${skin}: no RSC prefetch on load, and in-page links still scroll without a fetch`, async ({ page }) => {
    await seedTheme(page, { skin });
    const rsc: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("_rsc=")) rsc.push(r.url());
    });

    await page.goto("/en");
    await page.waitForTimeout(1500); // prefetches fire shortly after hydration
    expect(rsc, "in-page anchors must not prefetch the current route").toEqual([]);

    // The hero CTA that is visible in this skin.
    await page.locator('main a[href$="#projects"]:visible').first().click();
    await expect(page).toHaveURL(/\/en#projects$/);
    await expect(page.locator("#projects")).toBeInViewport();
    expect(rsc, "clicking an in-page link must not fetch").toEqual([]);
  });
}
