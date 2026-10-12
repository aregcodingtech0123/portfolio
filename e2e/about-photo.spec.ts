import { expect, seedTheme, test } from "./fixtures";

// The About photo used to be a raw 1200x1600 JPEG (~197 KB) shown in a 160 px
// box, fetched eagerly, and fetched even in the minimal skin where its whole
// block is display:none. It now goes through next/image and is lazy.

const RAW_PHOTO = "/images/profilephoto.jpeg";

async function scrollThroughPage(page: import("@playwright/test").Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize()!.height;
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(120);
  }
}

function trackPhotoRequests(page: import("@playwright/test").Page) {
  const urls: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.pathname === RAW_PHOTO || u.searchParams.get("url") === RAW_PHOTO) urls.push(r.url());
  });
  return urls;
}

test("terminal: the About photo is optimized, small and never fetched as the raw JPEG", async ({ page }) => {
  await seedTheme(page, { skin: "terminal" });
  const urls = trackPhotoRequests(page);
  const sizes: number[] = [];
  page.on("response", async (res) => {
    if (new URL(res.url()).searchParams.get("url") === RAW_PHOTO)
      sizes.push((await res.body()).length);
  });

  await page.goto("/en");
  await scrollThroughPage(page);
  const photo = page.locator(".profile-duotone img").first();
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);

  expect(urls.filter((u) => new URL(u).pathname === RAW_PHOTO), "raw original must not be requested").toEqual([]);
  expect(urls.length).toBeGreaterThanOrEqual(2); // hero portrait + About photo
  // Far below the 197 KB original, for every optimized variant requested.
  expect(Math.max(...sizes)).toBeLessThan(60_000);
});

test("minimal: the hidden About photo is never requested", async ({ page }) => {
  await seedTheme(page, { skin: "minimal" });
  const urls = trackPhotoRequests(page);

  await page.goto("/en");
  await scrollThroughPage(page);
  await page.waitForTimeout(300);

  const photo = page.locator(".profile-duotone img").first();
  await expect(photo).toBeHidden();
  // The hero portrait's optimized URL and nothing else: the hidden block adds no
  // request (it is lazy, and a display:none image is never near the viewport).
  expect(urls.filter((u) => new URL(u).pathname === RAW_PHOTO)).toEqual([]);
  expect(new Set(urls).size, `unexpected photo requests: ${urls.join(", ")}`).toBe(1);
});
