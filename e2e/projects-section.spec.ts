import { expect, seedTheme, test } from "./fixtures";

/*
 * The Projects section is rendered on the server and hydrated in place. Only
 * the project dialog reads ?project= (useSearchParams), inside its own
 * Suspense boundary. When the boundary wrapped the whole section, the client
 * discarded the server's cards and rendered them again, and until then the
 * cards ignored clicks (about 3.7 s on a 4x-CPU, Slow 4G phone).
 */

const TITLES = ["VocaBeacon AI-Powered Language Dictionary", "AtmosMind Weather Forecast", "Exqubit"];

test("the cards are in the server HTML and visible with JavaScript disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/en");
  const projects = page.locator("#projects");
  for (const title of TITLES) {
    await expect(projects.getByRole("heading", { name: title, level: 3 }).first()).toBeAttached();
  }
  await projects.scrollIntoViewIfNeeded();
  await expect(projects.locator("h3:visible").first()).toBeVisible();
  await context.close();
});

for (const skin of ["terminal", "minimal"] as const) {
  test(`${skin}: the server-rendered cards are hydrated in place, not replaced`, async ({ page }) => {
    await seedTheme(page, { skin, mode: "dark" });
    // Keep a reference to the first card button as the server delivered it.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __card: Element | null }).__card = document.querySelector("#projects h3 button");
      });
    });
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // The same node is still in the document after hydration, and it works.
    expect(
      await page.evaluate(() => {
        const card = (window as unknown as { __card: Element | null }).__card;
        return Boolean(card?.isConnected);
      }),
    ).toBe(true);
    const button = page.locator("#projects h3 button:visible").first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(/\?project=/);
  });
}

test("search and the category filters still narrow the list", async ({ page }) => {
  await seedTheme(page, { skin: "terminal", mode: "dark" });
  await page.goto("/en");
  const projects = page.locator("#projects");
  await projects.scrollIntoViewIfNeeded();
  const cards = projects.locator("h3:visible");
  await expect(cards).toHaveCount(TITLES.length);

  await projects.getByRole("searchbox").fill("Exqubit");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveText("Exqubit");

  await projects.getByRole("searchbox").fill("");
  await expect(cards).toHaveCount(TITLES.length);

  await projects.getByRole("button", { name: "Fullstack", exact: true }).click();
  await expect(cards).toHaveCount(0);
  await projects.getByRole("button", { name: "All", exact: true }).click();
  await expect(cards).toHaveCount(TITLES.length);
});
