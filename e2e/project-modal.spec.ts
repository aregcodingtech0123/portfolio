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

    // Cycle through the dialog several times. Whatever is really focusable
    // in this skin (the close button, the scrollable content region, any
    // visible footer link), focus must never leave the dialog -- in
    // particular the CSS-hidden footer close button must not act as the
    // trap's "last" element.
    for (let i = 0; i < 8; i++) {
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

// These verify real-browser behavior (where the region sits in the tab
// order, and that the arrow/Page keys scroll it). They can't guard against
// tabIndex={0} being removed: Chromium makes scrollable containers keyboard-
// focusable on its own, so they pass either way here (verified by removing
// it). Safari does not, which is what axe's scrollable-region-focusable rule
// (e2e/accessibility.spec.ts) and the ProjectModal unit test catch -- both
// were confirmed to fail with tabIndex removed.
for (const skin of ["terminal", "minimal"] as const) {
  test.describe(`ProjectModal scrollable content region: ${skin} skin`, () => {
    test(`the content region is the Tab stop right after the close button, and Shift+Tab returns to it (${skin})`, async ({
      page,
    }) => {
      const { dialog } = await openFirstProject(page, skin);
      const title = (await dialog.locator("h2").first().textContent())!.trim();
      const close = dialog.getByRole("button", { name: "Close" }).first();
      const region = dialog.getByRole("region", { name: title, exact: true });

      await expect(close).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(region).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(close).toBeFocused();
    });

    test(`a keyboard user can scroll an overflowing case study with the arrow and Page keys (${skin})`, async ({
      page,
    }) => {
      await seedTheme(page, { skin });
      // PRJ-003 overflows the region in both skins at this suite's default
      // 1280x720 viewport (measured: by 140px terminal, 197px minimal).
      await page.goto("/en?project=PRJ-003");
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible" });
      const title = (await dialog.locator("h2").first().textContent())!.trim();
      const region = dialog.getByRole("region", { name: title, exact: true });

      const overflow = await region.evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(overflow, "precondition: the content must actually overflow").toBeGreaterThan(0);

      // Reach it the way a keyboard user would, not via element.focus().
      await expect(dialog.getByRole("button", { name: "Close" }).first()).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(region).toBeFocused();

      const scrollTop = () => region.evaluate((el) => el.scrollTop);
      // Chromium animates keyboard scrolling, so a value read the moment it
      // first changes is mid-animation. Wait until two consecutive reads
      // agree before using it as the baseline for the next key.
      const settledScrollTop = async () => {
        let previous = Number.NaN;
        await expect
          .poll(
            async () => {
              const now = await scrollTop();
              const stable = now === previous;
              previous = now;
              return stable;
            },
            { intervals: [100] },
          )
          .toBe(true);
        return previous;
      };
      expect(await scrollTop()).toBe(0);

      await page.keyboard.press("ArrowDown");
      await expect.poll(scrollTop).toBeGreaterThan(0);
      const afterArrowDown = await settledScrollTop();

      await page.keyboard.press("PageDown");
      await expect.poll(scrollTop).toBeGreaterThan(afterArrowDown);
      const afterPageDown = await settledScrollTop();

      await page.keyboard.press("ArrowUp");
      await expect.poll(scrollTop).toBeLessThan(afterPageDown);
      const afterArrowUp = await settledScrollTop();

      await page.keyboard.press("PageUp");
      await expect.poll(scrollTop).toBeLessThan(afterArrowUp);

      // Scrolling moved the region, never focus.
      await expect(region).toBeFocused();
    });
  });
}
