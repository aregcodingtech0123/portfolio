import { expect, seedTheme, test, type Skin } from "./fixtures";

const CARD_SELECTOR = 'button[aria-label^="View project details"]';

async function openFirstProject(page: import("@playwright/test").Page, skin: Skin) {
  // Real persistence, not the ?skin= dev override: that override is
  // dead-code-eliminated from the production build this suite runs
  // against, so it would do nothing here.
  await seedTheme(page, { skin });
  await page.goto("/en");
  // Both skins' card markup matches this selector; :visible picks out
  // whichever one real CSS actually shows for the active skin.
  const card = page.locator(`${CARD_SELECTOR}:visible`).first();
  await card.waitFor({ state: "visible" });
  await card.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  return { card, dialog };
}

async function activeElementIsInsideDialog(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const dialogEl = document.querySelector('[role="dialog"]');
    return Boolean(dialogEl && dialogEl.contains(document.activeElement));
  });
}

test.describe("ProjectModal focus trap: minimal skin", () => {
  test("plain Tab from the close button never moves focus outside the dialog", async ({
    page,
  }) => {
    await openFirstProject(page, "minimal");
    const closeButton = page.getByRole("button", { name: "Close" });
    await expect(closeButton).toBeFocused();

    // Press Tab several times: with only one real focusable element in this
    // skin (the footer close button is minimal:hidden), focus must keep
    // landing back on it, never escaping onto the dialog's content div.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(
        await activeElementIsInsideDialog(page),
        `after ${i + 1} Tab press(es), document.activeElement must still be inside the dialog`,
      ).toBe(true);
    }
  });
});

test.describe("ProjectModal focus trap: terminal skin", () => {
  test("Tab and Shift+Tab wrap between the header and footer close buttons, both real elements here", async ({
    page,
  }) => {
    await openFirstProject(page, "terminal");

    const closeButtons = page.getByRole("button", { name: "Close" });
    await expect(closeButtons).toHaveCount(2);
    const [header, footer] = [closeButtons.nth(0), closeButtons.nth(1)];
    await expect(header).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(footer).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(header).toBeFocused();

    // The fix (filtering by real visibility) must not regress the skin
    // where both elements genuinely are visible and focusable.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(
        await activeElementIsInsideDialog(page),
        `after ${i + 1} Tab press(es), document.activeElement must still be inside the dialog`,
      ).toBe(true);
    }
  });
});

for (const skin of ["terminal", "minimal"] as const) {
  test.describe(`ProjectModal full flow: ${skin} skin`, () => {
    test(`opens from a card with the right content, locks body scroll, and closes on Escape, restoring scroll and focus (${skin})`, async ({
      page,
    }) => {
      const prevOverflow = await page.evaluate(() => document.body.style.overflow);

      const { card, dialog } = await openFirstProject(page, skin);
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog.locator("h2").first()).not.toBeEmpty();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      expect(await page.evaluate(() => document.body.style.overflow)).toBe(prevOverflow);
      await expect(card).toBeFocused();
    });

    test(`closes on a backdrop click, restoring focus to the triggering card (${skin})`, async ({
      page,
    }) => {
      const { card, dialog } = await openFirstProject(page, skin);

      // The backdrop is the dialog's sibling under the same role="presentation"
      // wrapper and renders before the dialog in document order.
      const backdrop = page.locator('[role="presentation"] > [aria-hidden]').first();
      await backdrop.click({ position: { x: 5, y: 5 } });

      await expect(dialog).toBeHidden();
      await expect(card).toBeFocused();
    });
  });
}
