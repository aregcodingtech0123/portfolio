import { expect, test } from "./fixtures";

test("the production build serves the homepage, redirected to the default locale", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
