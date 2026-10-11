import { expect, test } from "./fixtures";

test("visiting the root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
});

test("both /en and /tr render a real page with the matching lang attribute", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading").first()).toBeVisible();

  await page.goto("/tr");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("switching language from the navbar restores the scroll position", async ({
  page,
}) => {
  await page.goto("/en");
  // Scroll well down the page, past the hero, before switching.
  await page.evaluate(() => window.scrollTo(0, 1200));
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(500);

  // The trigger's name is its visible label plus its current value. It
  // also renders in the footer, so this picks the first match (the navbar's).
  await page.getByRole("button", { name: "Dil / Language English EN", exact: true }).first().click();
  // The option's accessible name includes the flag icon's title text, so
  // it's "Türkçe TR", not just "TR".
  await page.getByRole("option", { name: "Türkçe TR", exact: true }).first().click();
  await expect(page).toHaveURL(/\/tr(\?|$)/);

  // LanguageSwitcher explicitly restores scrollY after the locale swap
  // (see its scrollRestoreY ref); allow a small tolerance since content
  // height can shift slightly between locales' copy lengths.
  await expect(async () => {
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(150);
  }).toPass({ timeout: 5000 });
});
