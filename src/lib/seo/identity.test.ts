import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";
import { OWNER_IDENTITY } from "./identity";

describe("OWNER_IDENTITY", () => {
  it("job title matches the visible role badge in each locale", () => {
    expect(OWNER_IDENTITY.jobTitle.en).toBe(en.Hero.roleBadge);
    expect(OWNER_IDENTITY.jobTitle.tr).toBe(tr.Hero.roleBadge);
  });
});

describe("OWNER_IDENTITY profiles", () => {
  it("confirms GitHub and LinkedIn, whose URLs come from the content, not from here", async () => {
    const { migrationPortfolio } = await import("@/data/migration-portfolio");
    const { confirmedSameAs } = await import("./json-ld");
    expect(OWNER_IDENTITY.confirmedProfiles).toEqual(["github", "linkedin"]);
    const { githubUrl, linkedinUrl } = migrationPortfolio.siteSettings;
    expect(
      confirmedSameAs({ github: githubUrl, linkedin: linkedinUrl }, OWNER_IDENTITY.confirmedProfiles),
    ).toEqual([githubUrl, linkedinUrl]);
  });
});
