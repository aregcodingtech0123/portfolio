import { migrationPortfolio } from "../src/data/migration-portfolio";
import { expect, seedTheme, test, type Skin } from "./fixtures";

/**
 * Fallback content (playwright.config.ts blanks Sanity) has no locations.
 * These checks lock that: neither skin may grow a location node, separator,
 * or wrapper until an editor actually stores a value.
 */
const SKINS: Skin[] = ["terminal", "minimal"];

const experienceHeadings = migrationPortfolio.experience.map(
  (item) => `${item.role.en} @ ${item.company.en}`,
);
const experienceCompanies = migrationPortfolio.experience.map((item) => item.company.en);
const educationInstitutions = migrationPortfolio.education.map(
  (item) => item.institution.en,
);

test.describe("experience and education location (fallback: none stored)", () => {
  for (const skin of SKINS) {
    test(`${skin}: experience rows show company only, with no location chrome`, async ({
      page,
    }) => {
      await seedTheme(page, { skin });
      await page.goto("/en");

      if (skin === "minimal") {
        const orgs = page.locator("#experience .m-tl-org:visible");
        await expect(orgs).toHaveCount(experienceCompanies.length);
        expect(new Set(await orgs.allTextContents())).toEqual(
          new Set(experienceCompanies),
        );
        await expect(page.locator("#experience .m-tl-org .m-meta")).toHaveCount(0);
      } else {
        const headings = page.locator("#experience ol:visible li h3");
        await expect(headings).toHaveCount(experienceHeadings.length);
        expect(new Set(await headings.allTextContents())).toEqual(
          new Set(experienceHeadings),
        );
      }
    });

    test(`${skin}: education rows show institution only, with no location chrome`, async ({
      page,
    }) => {
      await seedTheme(page, { skin });
      await page.goto("/en");

      if (skin === "minimal") {
        const orgs = page.locator("#education .m-tl-org:visible");
        await expect(orgs).toHaveCount(educationInstitutions.length);
        expect(new Set(await orgs.allTextContents())).toEqual(
          new Set(educationInstitutions),
        );
        await expect(page.locator("#education .m-tl-org .m-meta")).toHaveCount(0);
      } else {
        const lines = page.locator("#education ol:visible li p.text-sm");
        await expect(lines).toHaveCount(educationInstitutions.length);
        expect(new Set(await lines.allTextContents())).toEqual(
          new Set(educationInstitutions),
        );
      }
    });
  }
});
