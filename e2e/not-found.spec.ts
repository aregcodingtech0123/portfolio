import { expect, test } from "./fixtures";

// Unknown URLs must keep answering 404 with a usable page, and the root must
// keep redirecting to the default locale. Pinned so that changes to the app's
// root layout (for example, moving <html> under [locale] so pages can be
// statically generated) cannot silently change routing or 404 behavior.

test("an unknown path under a locale is a real 404 with a way back, in the right language attribute", async ({
  page,
}) => {
  const res = await page.goto("/en/this-route-does-not-exist");
  expect(res!.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", /^(en|tr)$/);
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /.+/ }).first()).toBeVisible();
});

test("an unknown path under /tr is also a 404", async ({ page }) => {
  const res = await page.goto("/tr/bu-sayfa-yok");
  expect(res!.status()).toBe(404);
  await expect(page.getByText("404", { exact: true })).toBeVisible();
});

test("an unsupported locale prefix ends in a 404", async ({ page }) => {
  const res = await page.goto("/xx/anything");
  expect(res!.status()).toBe(404);
  await expect(page.getByText("404", { exact: true })).toBeVisible();
});

test("the bare root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("both locales serve the homepage with the matching lang attribute", async ({ page }) => {
  for (const locale of ["en", "tr"]) {
    const res = await page.goto(`/${locale}`);
    expect(res!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1:visible").first()).toBeVisible();
  }
});

test("the Studio route still serves its own document", async ({ request }) => {
  // HTML only: loading the Studio in a browser would make it call Sanity,
  // which the suite never allows.
  const res = await request.get("/content-hub");
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/<html[^>]*lang="[a-z]+"/);
  expect(html).toContain("<title>Content Hub</title>");
});
