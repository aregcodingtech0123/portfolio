import { describe, expect, it } from "vitest";
import { sectionNumbers, sections, visibleSections } from "@/config/sections";
import type { PortfolioContent } from "@/sanity/fetch";

type RelevantFields = Pick<
  PortfolioContent,
  | "projects"
  | "experience"
  | "education"
  | "skillCategories"
  | "educationCertificates"
  | "participationCertificates"
  | "ctfs"
>;

// isVisible only ever reads these five array fields (see src/config/sections.ts).
// The cast is safe because nothing else in that module touches the rest of
// PortfolioContent's shape, and the array entries' own content is never read,
// only .length -- {} stands in for "one item" throughout this file.
function content(overrides: Partial<RelevantFields>): PortfolioContent {
  return {
    projects: [],
    experience: [],
    education: [],
    skillCategories: [],
    educationCertificates: [],
    participationCertificates: [],
    ctfs: [],
    ...overrides,
  } as unknown as PortfolioContent;
}

function visibleIds(c: PortfolioContent) {
  return visibleSections(c).map((s) => s.id);
}

describe("visibleSections: the visibility axis", () => {
  it("shows only the always-visible sections when there is no content", () => {
    expect(visibleIds(content({}))).toEqual(["home", "about", "ctf", "contact"]);
  });

  it("adds projects once there is at least one project", () => {
    expect(visibleIds(content({ projects: [{} as never] }))).toContain("projects");
  });

  it("counts education and participation certificates together", () => {
    expect(
      visibleIds(content({ educationCertificates: [{} as never] })),
    ).toContain("certificates");
    expect(
      visibleIds(content({ participationCertificates: [{} as never] })),
    ).toContain("certificates");
  });

  it("shows every section once every content type is present", () => {
    const full = content({
      projects: [{} as never],
      experience: [{} as never],
      education: [{} as never],
      skillCategories: [{} as never],
      educationCertificates: [{} as never],
    });
    expect(visibleIds(full)).toEqual(sections.map((s) => s.id));
  });
});

describe("sectionNumbers: Simple skin header numbering", () => {
  it("numbers the rendered sections in config order and leaves home out", () => {
    expect(sectionNumbers(content({}))).toEqual({
      about: "01",
      contact: "02",
    });
  });

  it("numbers ctf only when it has entries, since an empty one is an unnumbered strip", () => {
    expect(sectionNumbers(content({})).ctf).toBeUndefined();
    expect(sectionNumbers(content({ ctfs: [{} as never] }))).toEqual({
      about: "01",
      ctf: "02",
      contact: "03",
    });
  });

  it("closes the gap when a section is hidden", () => {
    const withProjects = sectionNumbers(content({ projects: [{} as never] }));
    expect(withProjects).toEqual({
      about: "01",
      projects: "02",
      contact: "03",
    });
  });

  it("numbers every section 01..08 when all content is present", () => {
    const numbers = sectionNumbers(
      content({
        projects: [{} as never],
        experience: [{} as never],
        education: [{} as never],
        skillCategories: [{} as never],
        educationCertificates: [{} as never],
        ctfs: [{} as never],
      }),
    );
    expect(Object.values(numbers)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
    ]);
    expect(numbers.about).toBe("01");
    expect(numbers.contact).toBe("08");
    expect(numbers.home).toBeUndefined();
  });
});

describe("visibleSections: a hidden section must also disappear from nav and footer", () => {
  it("keeps ctf out of the nav and footer even though it is always visible", () => {
    const ctf = visibleSections(content({})).find((s) => s.id === "ctf");
    expect(ctf).toBeTruthy();
    expect(ctf?.inNav).toBe(false);
    expect(ctf?.inFooter).toBe(false);
  });

  it("with no content, only home/about/contact qualify for both nav and footer", () => {
    const visible = visibleSections(content({}));
    expect(visible.filter((s) => s.inNav).map((s) => s.id)).toEqual([
      "home",
      "about",
      "contact",
    ]);
    expect(visible.filter((s) => s.inFooter).map((s) => s.id)).toEqual([
      "home",
      "about",
      "contact",
    ]);
  });

  it("experience and education reach the nav but never the footer, even once visible", () => {
    const visible = visibleSections(
      content({ experience: [{} as never], education: [{} as never] }),
    );
    const inNav = visible.filter((s) => s.inNav).map((s) => s.id);
    const inFooter = visible.filter((s) => s.inFooter).map((s) => s.id);

    expect(inNav).toContain("experience");
    expect(inNav).toContain("education");
    expect(inFooter).not.toContain("experience");
    expect(inFooter).not.toContain("education");
  });

  it("with everything visible, nav excludes only ctf and footer also excludes experience/education/certificates", () => {
    const visible = visibleSections(
      content({
        projects: [{} as never],
        experience: [{} as never],
        education: [{} as never],
        skillCategories: [{} as never],
        educationCertificates: [{} as never],
        ctfs: [{} as never],
      }),
    );
    const inNav = visible.filter((s) => s.inNav).map((s) => s.id);
    const inFooter = visible.filter((s) => s.inFooter).map((s) => s.id);

    expect(inNav).toEqual([
      "home",
      "about",
      "projects",
      "experience",
      "education",
      "skills",
      "certificates",
      "contact",
    ]);
    expect(inFooter).toEqual(["home", "about", "projects", "skills", "contact"]);
  });
});
