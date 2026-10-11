import { expect, test } from "./fixtures";

/**
 * No skip-to-content link exists anywhere in this app (confirmed via a
 * repo-wide search for "skip link"/"SkipLink"/"skip-to-content" before
 * writing this file) -- there's nothing to drive here. Not fixed: adding
 * one would be an application behavior change outside this task's
 * focus-trap-only scope, and it's noted as a finding separately.
 */

test("Tab order visits distinct elements without getting stuck in an accidental trap", async ({
  page,
}) => {
  await page.goto("/en");

  const seen = new Set<string>();
  let stuckCount = 0;

  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const id = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // A reasonably stable per-element fingerprint without relying on a
      // real id attribute, which most of these elements don't have.
      const rect = el.getBoundingClientRect();
      return `${el.tagName}:${el.textContent?.slice(0, 30)}:${Math.round(rect.top)}:${Math.round(rect.left)}`;
    });
    if (!id) continue;
    if (seen.has(id)) {
      stuckCount++;
    } else {
      seen.add(id);
      stuckCount = 0;
    }
    // Landing on the exact same element 3 times running (not just
    // revisiting one seen earlier, e.g. cycling normally) would indicate
    // focus is stuck, not progressing.
    expect(stuckCount, `focus appears stuck on the same element: ${id}`).toBeLessThan(3);
  }

  // 20 Tab presses from the top of a page this content-heavy should reach
  // well over a handful of distinct interactive elements.
  expect(seen.size).toBeGreaterThan(10);
});

test("a representative sample of interactive elements has a visible focus indicator", async ({
  page,
}) => {
  await page.goto("/en");

  const withoutIndicator: string[] = [];

  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    const result = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const hasOutline = style.outlineStyle !== "none" && style.outlineWidth !== "0px";
      const hasBoxShadow = style.boxShadow !== "none" && style.boxShadow !== "";
      return {
        label: `${el.tagName}:${el.textContent?.slice(0, 30) ?? el.getAttribute("aria-label")}`,
        visible: hasOutline || hasBoxShadow,
      };
    });
    if (result && !result.visible) withoutIndicator.push(result.label);
  }

  expect(
    withoutIndicator,
    `these focused elements had neither a visible outline nor a box-shadow: ${withoutIndicator.join(", ")}`,
  ).toEqual([]);
});
