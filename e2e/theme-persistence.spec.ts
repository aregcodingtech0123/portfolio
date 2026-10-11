import { expect, test } from "./fixtures";

// NavSelect triggers are named by the visible micro-label followed by the
// trigger's current value (aria-labelledby="label trigger"), so the names
// below are "<label> <current value>". e2e/nav-select-names.spec.ts pins
// those names down in both locales.

// The default mode follows prefers-color-scheme, and Playwright emulates
// "light" unless told otherwise -- which made picking "Light" below a
// no-op. Start from dark so the switch is a real change.
test.use({ colorScheme: "dark" });
async function pickOption(
  page: import("@playwright/test").Page,
  triggerName: string,
  optionName: string,
) {
  await page.getByRole("button", { name: triggerName, exact: true }).click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

test("switching skin and mode from the navbar survives a reload", async ({ page }) => {
  await page.goto("/en");

  await pickOption(page, "Görünüm / Skin Terminal", "Minimal");
  await pickOption(page, "Tema / Mode Dark", "Light");

  await expect(page.locator("html")).toHaveAttribute("data-skin", "minimal");
  await expect(page.locator("html")).toHaveClass(/light/);

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-skin", "minimal");
  await expect(page.locator("html")).toHaveClass(/light/);
});

test("switching locale from the navbar does not reset the theme choice", async ({
  page,
}) => {
  await page.goto("/en");

  await pickOption(page, "Görünüm / Skin Terminal", "Minimal");
  await pickOption(page, "Tema / Mode Dark", "Light");

  // The language switcher also renders in the footer, so this picks the
  // first match (the navbar's) rather than require a strict single match.
  await page.getByRole("button", { name: "Dil / Language English EN", exact: true }).first().click();
  // The option's accessible name includes the flag icon's title text, so
  // it's "Türkçe TR", not just "TR".
  await page.getByRole("option", { name: "Türkçe TR", exact: true }).first().click();
  await expect(page).toHaveURL(/\/tr(\?|$)/);

  await expect(page.locator("html")).toHaveAttribute("data-skin", "minimal");
  await expect(page.locator("html")).toHaveClass(/light/);
});
