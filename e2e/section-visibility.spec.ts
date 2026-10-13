import { expect, test } from "./fixtures";

/**
 * This suite's webServer runs with sanityConfigured=false (see
 * playwright.config.ts), so every request deterministically serves the
 * real fallback dataset (src/data/migration-portfolio.ts), which has
 * non-empty content for every conditionally-visible section. That rules
 * out demonstrating the *absence* branch here: driving it "through
 * intercepted content" would require Sanity's content fetch (which runs
 * in a Server Component, during SSR) to be interceptable, but
 * page.route() only sees requests made from the browser page -- a
 * separate Node process makes that one. @sanity/client's Node transport
 * goes through its own `get-it` request layer (confirmed in
 * node_modules/get-it/src/request/node/), not a globally mockable
 * fetch/undici dispatcher, and giving it a test-only endpoint override
 * would mean adding one to src/sanity/client.ts, an application-code
 * change outside the focus-trap fix this task scopes "don't change
 * app behavior" around.
 *
 * What IS genuinely verified here instead: with real content, the whole
 * pipeline -- Server Component rendering -> visibleSections() -> Navbar's
 * and Footer's filters -> actual DOM -- agrees with src/config/sections.ts
 * for every section that should appear, in both the page and both
 * navigation surfaces. The *logic* that an empty section also disappears
 * from nav and footer together is already covered by
 * src/config/sections.test.ts's full empty/partial/full matrix; this
 * suite covers the wiring a unit test cannot: that the real rendered page
 * actually agrees with that config, not just the pure function.
 */

const SECTIONS_WITH_CONTENT = [
  { id: "projects", navLabel: "Projects", inFooter: true },
  { id: "experience", navLabel: "Experience", inFooter: false },
  { id: "education", navLabel: "Education", inFooter: false },
  { id: "skills", navLabel: "Skills", inFooter: true },
  { id: "certificates", navLabel: "Certificates", inFooter: false },
];

test("every section with real fallback content appears in the page, and in the nav/footer exactly as sections.ts configures", async ({
  page,
}) => {
  await page.goto("/en");

  for (const { id } of SECTIONS_WITH_CONTENT) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }

  const nav = page.locator("nav").first();
  const footer = page.locator("footer");

  for (const { navLabel, inFooter } of SECTIONS_WITH_CONTENT) {
    await expect(nav.getByRole("link", { name: new RegExp(navLabel) })).toBeVisible();
    const footerLink = footer.getByRole("link", { name: navLabel, exact: true });
    if (inFooter) {
      await expect(footerLink).toBeVisible();
    } else {
      await expect(footerLink).toHaveCount(0);
    }
  }

  // ctf is deliberately excluded from both nav and footer regardless of
  // content (inNav: false, inFooter: false in sections.ts).
  await expect(nav.getByRole("link", { name: /CTF/ })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "CTF", exact: true })).toHaveCount(0);
});

test("the CTF section is not rendered while it has no entries (the fallback dataset has none)", async ({
  page,
}) => {
  for (const locale of ["en", "tr"]) {
    await page.goto(`/${locale}`);
    await expect(page.locator("#ctf")).toHaveCount(0);
    // Its placeholder copy is gone with it, in both skins' markup.
    await expect(page.locator("body")).not.toContainText(
      locale === "en" ? "No public results yet" : "Henüz genel sonuç yok",
    );
  }
});

test("terminal section labels are numbered consecutively over the rendered sections (CTF hidden)", async ({
  page,
}) => {
  for (const locale of ["en", "tr"]) {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("data-skin", "terminal");
    // textContent, not innerText: sections off screen skip rendering
    // (content-visibility: auto) and innerText is empty for them. Only labels
    // the Terminal skin displays count (checkVisibility ignores that skipping).
    const labels = await page.locator("main p").evaluateAll((nodes) =>
      nodes
        .filter((p) => /^\/\/ \d{2} /.test(p.textContent ?? "") && p.checkVisibility())
        .map((p) => (p.textContent ?? "").trim()),
    );
    const numbers = labels.map((label) => Number(label.slice(3, 5)));
    // home is 01 and about 02 (neither has a numbered label), so labels start at 03.
    expect(numbers).toEqual(numbers.map((_, i) => i + 3));
    expect(labels.some((label) => label.startsWith("// 08 ") && /contact|iletişim/.test(label))).toBe(true);
    // The nav counts the same way: its Contact entry carries the same number.
    await expect(page.locator("nav").first()).toContainText(/08\s*(Contact|İletişim)/);
  }
});
