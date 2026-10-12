import { expect, seedTheme, test, type Skin } from "./fixtures";

// Only Inter (the body font both skins use) is preloaded. The skin-specific
// families (Bricolage Grotesque and JetBrains Mono for terminal, Source Serif
// 4 for minimal) have preload:false, so a visitor downloads only the ones
// their skin actually paints, and a runtime skin switch fetches the other
// skin's family on demand. display:swap keeps text visible (in a
// metric-matched fallback) while that happens.

test.use({ colorScheme: "dark" });

const fontStatuses = (page: import("@playwright/test").Page, family: string) =>
  page.evaluate(
    (f) => [...document.fonts].filter((x) => x.family.replace(/"/g, "") === f).map((x) => x.status),
    family,
  );

test("only Inter's two subsets are preloaded", async ({ request }) => {
  const res = await request.get("/en");
  const html = await res.text();
  const header = res.headers()["link"] ?? "";
  const hrefs = new Set<string>();
  for (const tag of html.match(/<link[^>]*>/g) ?? [])
    if (/rel="preload"/.test(tag) && /as="font"/.test(tag)) hrefs.add(tag.match(/href="([^"]+)"/)![1]);
  for (const part of header.split(/,\s*(?=<)/))
    if (/rel="?preload"?/.test(part) && /as="?font"?/.test(part)) hrefs.add(part.match(/<([^>]+)>/)![1]);
  // Inter: latin + latin-ext.
  expect([...hrefs]).toHaveLength(2);
});

const OTHER: Record<Skin, { family: string; skin: Skin }> = {
  terminal: { family: "Source Serif 4", skin: "minimal" },
  minimal: { family: "Bricolage Grotesque", skin: "terminal" },
};

for (const skin of ["terminal", "minimal"] as const satisfies Skin[]) {
  test(`${skin}: the other skin's heading font is not fetched, then is when switching to it`, async ({ page }) => {
    await seedTheme(page, { skin });
    const fonts: string[] = [];
    page.on("response", (r) => {
      if (/\.woff2(\?|$)/.test(r.url())) fonts.push(r.url());
    });
    await page.goto("/en");
    await page.evaluate(() => document.fonts.ready);

    const { family, skin: target } = OTHER[skin];
    expect(await fontStatuses(page, family), `${family} must not load for a ${skin} visitor`).not.toContain("loaded");
    const before = fonts.length;

    const triggerName = skin === "terminal" ? "Skin Terminal" : "Skin Minimal";
    const optionName = target === "minimal" ? "Minimal" : "Terminal";
    await page.getByRole("button", { name: triggerName, exact: true }).click();
    await page.getByRole("option", { name: optionName, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-skin", target);

    // The text is visible straight away (swap), and the family arrives on demand.
    const h1 = page.locator("h1:visible").first();
    await expect(h1).toBeVisible();
    expect(await h1.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
    await expect
      .poll(() => fontStatuses(page, family), { timeout: 10_000 })
      .toContain("loaded");
    expect(fonts.length, "switching skins must fetch the new family").toBeGreaterThan(before);
  });
}
