import { expect, seedTheme, test, type Skin } from "./fixtures";

// The hero portrait is the mobile LCP element in both skins. It used to mount
// only after hydration and a client HEAD probe, so it could not start
// downloading until the page's JavaScript had run. These tests pin the fix:
// the image is in the first HTML response, needs no JavaScript, is never
// probed, and does not move anything when it loads.

test("the portrait <img> and its preload are in the server HTML", async ({ request }) => {
  const html = await (await request.get("/en")).text();
  // An <img> pointing at the optimized portrait, in the markup itself.
  expect(html).toMatch(/<img[^>]+src="\/_next\/image\?url=%2Fimages%2Fprofilephoto\.jpeg[^"]*"/);
  // And a preload the browser can act on before it parses the body.
  expect(html).toMatch(/<link[^>]+rel="preload"[^>]+as="image"[^>]+profilephoto/);
});

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the portrait is visible and loaded", async ({ page }) => {
    await page.goto("/en");
    const img = page.locator("figure img").first();
    await expect(img).toBeVisible();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    const box = await img.boundingBox();
    expect(box!.height / box!.width).toBeCloseTo(4 / 3, 1);
  });
});

for (const skin of ["terminal", "minimal"] as const satisfies Skin[]) {
  test(`${skin}: portrait loads with no HEAD probe and causes no layout shift`, async ({ page }) => {
    await seedTheme(page, { skin });
    await page.addInitScript(() => {
      const w = window as unknown as { __portraitShifts: number };
      w.__portraitShifts = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          hadRecentInput: boolean;
          sources?: { node?: Node }[];
        }[]) {
          if (entry.hadRecentInput) continue;
          const hit = (entry.sources ?? []).some(
            (s) => s.node && (s.node as Element).closest?.("figure"),
          );
          if (hit) w.__portraitShifts += 1;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const heads: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "HEAD") heads.push(r.url());
    });

    await page.goto("/en");
    const img = page.locator("figure img:visible").first();
    await expect(img).toBeVisible();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    await page.waitForTimeout(500);

    expect(heads, "the portrait must not be probed with a HEAD request").toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __portraitShifts: number }).__portraitShifts)).toBe(0);
  });
}

// On a phone the caption ("AI Engineering · Full Stack · Cybersecurity") is
// wider than the photo. It used to set the figure's width, so when the mono
// web font replaced its fallback (whose metrics differ wherever Arial is
// missing: Linux, Android) the figure's box changed width and its edge moved:
// a layout shift of the whole figure, mobile CLS 0.0121 on Linux. Neither the
// figure nor the photo may depend on the caption's font.
for (const locale of ["en", "tr"] as const) {
  test(`terminal, phone width (${locale}): the caption's font metrics cannot move the figure or the photo`, async ({ page }) => {
    await seedTheme(page, { skin: "terminal" });
    // No entrance animation: the reveal moves the photo for ~0.5s, which
    // would be measured as movement that has nothing to do with the caption.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 412, height: 823 });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);

    const figure = page.locator("#home figure").first();
    const photo = figure.locator("> div").first();
    const figureBefore = (await figure.boundingBox())!;
    const before = (await photo.boundingBox())!;
    // A very different face and size: far bigger than any fallback swap.
    await page.addStyleTag({
      content: "#home figcaption { font-family: serif !important; font-size: 15px !important; letter-spacing: 0.2em !important; }",
    });
    const after = (await photo.boundingBox())!;
    const figureAfter = (await figure.boundingBox())!;

    // The figure's box does not follow the caption, and neither does the photo.
    expect(figureAfter.x).toBe(figureBefore.x);
    expect(figureAfter.width).toBe(figureBefore.width);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.width).toBe(before.width);
  });
}
