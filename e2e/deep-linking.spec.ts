import { expect, test } from "./fixtures";

test("loading ?project=<code> opens the right modal directly, with no stuck dialog beforehand", async ({
  page,
}) => {
  await page.goto("/en?project=PRJ-001");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2").first()).toHaveText("AtmosMind Weather Forecast");
});

test("closing the deep-linked modal removes the query param without a full navigation", async ({
  page,
}) => {
  await page.goto("/en?project=PRJ-001");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // A marker that only survives a client-side route replace, not a full
  // page reload, proves the URL change is router.replace (as the
  // component's own comment says), not a hard navigation.
  await page.evaluate(() => {
    (window as unknown as { __noReloadMarker: boolean }).__noReloadMarker = true;
  });

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/^(?!.*project=).*$/);

  const markerSurvived = await page.evaluate(
    () => (window as unknown as { __noReloadMarker?: boolean }).__noReloadMarker === true,
  );
  expect(markerSurvived).toBe(true);
});

test("an unknown project code renders the page normally, with no error and no stuck empty dialog", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await page.goto("/en?project=this-code-does-not-exist");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading").first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("a malformed project code (special characters) renders the page normally", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await page.goto(`/en?project=${encodeURIComponent("<script>//../?&=")}`);

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading").first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
