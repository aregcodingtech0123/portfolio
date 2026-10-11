import { expect, test } from "./fixtures";

// NavSelect's trigger sets BOTH aria-label and (when showLabel is true, the
// default) aria-labelledby pointing at the visible micro-label span. Per
// ARIA accessible-name computation, aria-labelledby takes precedence, so
// the real accessible name is that bilingual micro-label text ("Görünüm /
// Skin" etc.), not the semantic aria-label ("Visual style" etc.) NavSelect
// also sets. Confirmed via a Playwright trace snapshot after the obvious
// name guess timed out.
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

  await pickOption(page, "Görünüm / Skin", "Minimal");
  await pickOption(page, "Tema / Mode", "Light");

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

  await pickOption(page, "Görünüm / Skin", "Minimal");
  await pickOption(page, "Tema / Mode", "Light");

  // The language switcher also renders in the footer, so this picks the
  // first match (the navbar's) rather than require a strict single match.
  await page.getByRole("button", { name: "Dil / Language", exact: true }).first().click();
  // The option's accessible name includes the flag icon's title text, so
  // it's "Türkçe TR", not just "TR".
  await page.getByRole("option", { name: "Türkçe TR", exact: true }).first().click();
  await expect(page).toHaveURL(/\/tr(\?|$)/);

  await expect(page.locator("html")).toHaveAttribute("data-skin", "minimal");
  await expect(page.locator("html")).toHaveClass(/light/);
});
