import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { migrationPortfolio } from "@/data/migration-portfolio";
import type {
  SanityCtf,
  SanityEducation,
  SanityExperience,
  SanityProject,
  SanitySiteSettings,
  SanitySkill,
} from "@/sanity/types";

// client.fetch is mocked at this boundary on every test: no network call is
// ever made, and the "which payload comes back" question is fully controlled
// per test instead of depending on a real Sanity project.
const fetchMock = vi.fn();

type LoadOptions = {
  configured: boolean;
  payload?: unknown;
  rejectWith?: unknown;
};

/**
 * Fresh module graph per call via resetModules + doMock + dynamic import.
 * sanityConfigured is a module-level const computed once from env vars, so
 * the only reliable way to flip it between tests is to re-import the module
 * under a freshly mocked ../../sanity/env each time, rather than relying on
 * ESM live-binding behavior for a mocked export.
 */
async function loadFetch({ configured, payload, rejectWith }: LoadOptions) {
  vi.doMock("../../sanity/env", () => ({
    sanityConfigured: configured,
    apiVersion: "2025-01-01",
    dataset: configured ? "test-dataset" : "",
    projectId: configured ? "test-project" : "",
    studioUrl: "/content-hub",
  }));
  vi.doMock("@/sanity/client", () => ({
    getSanityClient: () => (configured ? { fetch: fetchMock } : null),
  }));
  if (rejectWith !== undefined) {
    fetchMock.mockRejectedValue(rejectWith);
  } else if (payload !== undefined) {
    fetchMock.mockResolvedValue(payload);
  }
  return import("@/sanity/fetch");
}

function sanityProject(overrides: Partial<SanityProject> = {}): SanityProject {
  return {
    _id: "sanity-project-1",
    slug: "sanity-project-1",
    status: "live",
    title: { en: "Sanity Project", tr: "Sanity Projesi" },
    description: { en: "From Sanity.", tr: "Sanity'den." },
    technologies: ["TypeScript"],
    category: "fullstack",
    order: 0,
    featured: true,
    ...overrides,
  };
}

function sanityCtf(overrides: Partial<SanityCtf> = {}): SanityCtf {
  return {
    _id: "ctf-1",
    title: "Sample CTF",
    slug: "sample-ctf",
    platform: "HTB",
    difficulty: "easy",
    dateSolved: "2026-01-01",
    tools: [],
    ...overrides,
  };
}

function sanitySkill(
  overrides: Partial<SanitySkill> & Pick<SanitySkill, "_id" | "name" | "category">,
): SanitySkill {
  return {
    categoryOrder: 0,
    order: 0,
    ...overrides,
  };
}

function sanityExperience(
  overrides: Partial<SanityExperience> & Pick<SanityExperience, "_id" | "company">,
): SanityExperience {
  return {
    role: { en: "Engineer", tr: "Mühendis" },
    period: { en: "01/2020 \u2013 02/2020", tr: "01/2020 \u2013 02/2020" },
    description: { en: "Work.", tr: "İş." },
    order: 0,
    ...overrides,
  };
}

function sanityEducation(
  overrides: Partial<SanityEducation> & Pick<SanityEducation, "_id" | "institution">,
): SanityEducation {
  return {
    degree: { en: "B.Sc.", tr: "Lisans" },
    fieldOfStudy: { en: "Computer Engineering", tr: "Bilgisayar Mühendisliği" },
    startDate: "2021",
    endDate: "2025",
    order: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
});

describe("getPortfolioContent branch matrix", () => {
  it("uses the full fallback and never calls fetch when Sanity is not configured", async () => {
    const { getPortfolioContent } = await loadFetch({ configured: false });
    const result = await getPortfolioContent("en");

    expect(result.source).toBe("fallback");
    expect(result.siteName).toBe(migrationPortfolio.siteSettings.siteName);
    expect(result.projects).toHaveLength(migrationPortfolio.projects.length);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the full fallback when Sanity is configured but returns nothing structured", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {},
    });
    const result = await getPortfolioContent("en");

    expect(result.source).toBe("fallback");
    expect(result.projects).toHaveLength(migrationPortfolio.projects.length);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to migration data on a fetch error instead of throwing", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      rejectWith: new Error("network down"),
    });
    const result = await getPortfolioContent("en");

    expect(result.source).toBe("fallback");
    expect(result.projects).toHaveLength(migrationPortfolio.projects.length);
  });

  it("applies the per-field fallback: Sanity's projects win, untouched fields borrow from migration data", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: { projects: [sanityProject()] },
    });
    const result = await getPortfolioContent("en");

    expect(result.source).toBe("sanity");
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].title).toBe("Sanity Project");

    // Experience and skills were never provided in this payload, so they
    // should carry the migration fallback, not come back empty.
    expect(result.experience.length).toBe(migrationPortfolio.experience.length);
    expect(result.skillCategories.length).toBeGreaterThan(0);
  });

  it("sorts Sanity experience by period, newest and ongoing first, ignoring document order", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        experience: [
          sanityExperience({
            _id: "lab",
            company: { en: "Lab", tr: "Lab" },
            period: { en: "10/2023 \u2013 01/2025", tr: "10/2023 \u2013 01/2025" },
            order: 0,
          }),
          sanityExperience({
            _id: "current",
            company: { en: "Current Co", tr: "Current Co" },
            period: { en: "08/2025 \u2013 Present", tr: "08/2025 \u2013 Günümüz" },
            order: 1,
          }),
          sanityExperience({
            _id: "remax",
            company: { en: "RE/MAX", tr: "RE/MAX" },
            period: { en: "08/2025 \u2013 10/2025", tr: "08/2025 \u2013 10/2025" },
            order: 2,
          }),
        ],
      },
    });

    const en = await getPortfolioContent("en");
    expect(en.experience.map((item) => item.company)).toEqual([
      "Current Co",
      "RE/MAX",
      "Lab",
    ]);

    const tr = await getPortfolioContent("tr");
    expect(tr.experience.map((item) => item.company)).toEqual([
      "Current Co",
      "RE/MAX",
      "Lab",
    ]);
    expect(tr.experience[0]?.period).toContain("Günümüz");
  });

  it("never borrows migration data for CTFs, unlike every other field", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: { projects: [sanityProject()] }, // ctfs omitted entirely
    });
    const result = await getPortfolioContent("en");

    // Education is also omitted here and DOES fall back (non-empty).
    expect(result.education.length).toBeGreaterThan(0);
    // CTFs have no fallback by design: an absent/empty result stays empty.
    expect(result.ctfs).toEqual([]);
  });

  it("passes real CTF data straight through when Sanity does provide it", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        projects: [sanityProject()],
        ctfs: [sanityCtf({ title: "Real CTF" })],
      },
    });
    const result = await getPortfolioContent("en");

    expect(result.ctfs).toHaveLength(1);
    expect(result.ctfs[0].title).toBe("Real CTF");
  });

  it("strips a placeholder contact email, warns, and leaves the rest of the merge intact", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const siteSettings: SanitySiteSettings = {
      siteName: "Test Site From Sanity",
      githubUrl: "https://github.com/test",
      linkedinUrl: "https://linkedin.com/in/test",
      email: "someone@example.com",
      location: { en: "Testville", tr: "Testsehir" },
    };

    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: { siteSettings },
    });
    const result = await getPortfolioContent("en");

    expect(result.contact.email).toBe("");
    expect(result.siteName).toBe("Test Site From Sanity");
    expect(result.social.github).toBe("https://github.com/test");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Ignoring placeholder contact email"),
    );

    warnSpy.mockRestore();
  });

  it("groups new skill categories after the existing ones, in both locales, and skips empty categories", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        skills: [
          sanitySkill({
            _id: "db",
            name: "PostgreSQL",
            category: "databases",
            categoryOrder: 6,
          }),
          sanitySkill({
            _id: "pl",
            name: "Rust",
            category: "programming-languages",
            categoryOrder: 5,
          }),
          sanitySkill({
            _id: "ai",
            name: "LangChain",
            category: "ai",
            categoryOrder: 0,
          }),
          sanitySkill({
            _id: "blank",
            name: "Ghost",
            category: "   ",
            categoryOrder: 1,
          }),
          sanitySkill({
            _id: "unknown",
            name: "Custom Tool",
            category: "custom-lab",
            categoryOrder: 9,
          }),
        ],
      },
    });

    const en = await getPortfolioContent("en");
    expect(en.skillCategories.map((cat) => cat.id)).toEqual([
      "ai",
      "programming-languages",
      "databases",
      "custom-lab",
    ]);
    expect(en.skillCategories.map((cat) => cat.label)).toEqual([
      "AI & Machine Learning",
      "Programming Languages",
      "Databases",
      "custom-lab",
    ]);
    expect(en.skillCategories.map((cat) => cat.skills.map((skill) => skill.name))).toEqual([
      ["LangChain"],
      ["Rust"],
      ["PostgreSQL"],
      ["Custom Tool"],
    ]);
    expect(en.skillCategories.some((cat) => cat.id === "frontend")).toBe(false);
    expect(en.skillCategories.some((cat) => cat.id === "security")).toBe(false);
    expect(en.skillCategories.some((cat) => cat.skills.some((skill) => skill.name === "Ghost"))).toBe(
      false,
    );

    const tr = await getPortfolioContent("tr");
    expect(tr.skillCategories.map((cat) => cat.id)).toEqual([
      "ai",
      "programming-languages",
      "databases",
      "custom-lab",
    ]);
    expect(tr.skillCategories.map((cat) => cat.label)).toEqual([
      "Yapay Zeka ve Makine Öğrenmesi",
      "Programlama Dilleri",
      "Veritabanları",
      "custom-lab",
    ]);
  });
});

describe("external links from Sanity are only passed through when they are http(s) URLs", () => {
  const UNSAFE = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "//evil.example/x",
    "/relative/path",
    "ftp://example.com/file",
    "not a url",
  ];

  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it.each(UNSAFE)("drops %s from a project's links and warns", async (bad) => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        projects: [sanityProject({ githubUrl: bad, liveUrl: bad })],
      },
    });
    const [project] = (await getPortfolioContent("en")).projects;

    expect(project.githubUrl).toBeUndefined();
    expect(project.liveUrl).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Dropped an unsafe link"));
  });

  it("keeps good links, trimmed, and only drops the bad one", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        projects: [
          sanityProject({
            githubUrl: "  https://github.com/example/repo  ",
            liveUrl: "javascript:alert(1)",
          }),
        ],
      },
    });
    const [project] = (await getPortfolioContent("en")).projects;

    expect(project.githubUrl).toBe("https://github.com/example/repo");
    expect(project.liveUrl).toBeUndefined();
  });

  it("accepts http as well as https (the shared helper's rule)", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: { projects: [sanityProject({ liveUrl: "http://demo.example.com" })] },
    });
    expect((await getPortfolioContent("en")).projects[0].liveUrl).toBe("http://demo.example.com");
  });

  it("drops an unsafe CTF write-up link, and no longer reports a write-up that does not exist", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        projects: [sanityProject()],
        ctfs: [sanityCtf({ writeupUrl: "javascript:alert(1)" })],
      },
    });
    const [ctf] = (await getPortfolioContent("en")).ctfs;

    expect(ctf.writeupUrl).toBeUndefined();
    expect(ctf.hasWriteup).toBe(false);
  });

  it("still reports a write-up when the CTF has a body even though its link was dropped", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        projects: [sanityProject()],
        ctfs: [sanityCtf({ writeupUrl: "javascript:alert(1)", writeup: [{ _type: "block" }] })],
      },
    });
    const [ctf] = (await getPortfolioContent("en")).ctfs;

    expect(ctf.writeupUrl).toBeUndefined();
    expect(ctf.hasWriteup).toBe(true);
  });

  it("keeps a good CTF write-up link", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        projects: [sanityProject()],
        ctfs: [sanityCtf({ writeupUrl: "https://blog.example.com/writeup" })],
      },
    });
    const [ctf] = (await getPortfolioContent("en")).ctfs;

    expect(ctf.writeupUrl).toBe("https://blog.example.com/writeup");
    expect(ctf.hasWriteup).toBe(true);
  });

  it("replaces an unsafe social link with the built-in one instead of rendering it", async () => {
    const siteSettings: SanitySiteSettings = {
      siteName: "Site",
      githubUrl: "javascript:alert(1)",
      linkedinUrl: "https://www.linkedin.com/in/someone",
      email: "",
      location: { en: "Here", tr: "Burada" },
    };
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: { siteSettings },
    });
    const { social } = await getPortfolioContent("en");

    expect(social.github).toBe(migrationPortfolio.siteSettings.githubUrl);
    expect(social.linkedin).toBe("https://www.linkedin.com/in/someone");
  });
});

describe("experience and education location mapping", () => {
  it("does not attach location on fallback items that never stored one", async () => {
    const { getPortfolioContent } = await loadFetch({ configured: false });
    const result = await getPortfolioContent("en");
    expect(result.experience.length).toBeGreaterThan(0);
    expect(result.education.length).toBeGreaterThan(0);
    for (const item of result.experience) {
      expect(item).not.toHaveProperty("location");
    }
    for (const item of result.education) {
      expect(item).not.toHaveProperty("location");
    }
  });

  it("resolves location per locale when both en and tr are set", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        experience: [
          sanityExperience({
            _id: "with-location",
            company: { en: "Acme", tr: "Acme" },
            location: { en: "Lisbon, Portugal", tr: "Lizbon, Portekiz" },
          }),
        ],
        education: [
          sanityEducation({
            _id: "edu-with-location",
            institution: { en: "Ankara Science University", tr: "Ankara Bilim Üniversitesi" },
            location: { en: "Ankara, Turkey", tr: "Ankara, Türkiye" },
          }),
        ],
      },
    });

    const en = await getPortfolioContent("en");
    expect(en.experience[0]?.location).toBe("Lisbon, Portugal");
    expect(en.education[0]?.location).toBe("Ankara, Turkey");

    const tr = await getPortfolioContent("tr");
    expect(tr.experience[0]?.location).toBe("Lizbon, Portekiz");
    expect(tr.education[0]?.location).toBe("Ankara, Türkiye");
  });

  it("falls back to English when the active locale value is missing", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        experience: [
          sanityExperience({
            _id: "en-only",
            company: { en: "Acme", tr: "Acme" },
            location: { en: "Remote" },
          }),
        ],
        education: [
          sanityEducation({
            _id: "edu-en-only",
            institution: { en: "Ankara Science University", tr: "Ankara Bilim Üniversitesi" },
            location: { en: "Ankara, Turkey" },
          }),
        ],
      },
    });

    const tr = await getPortfolioContent("tr");
    expect(tr.experience[0]?.location).toBe("Remote");
    expect(tr.education[0]?.location).toBe("Ankara, Turkey");
  });

  it("treats blank or whitespace location as missing", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        experience: [
          sanityExperience({
            _id: "blank",
            company: { en: "Acme", tr: "Acme" },
            location: { en: "   ", tr: "\t" },
          }),
        ],
        education: [
          sanityEducation({
            _id: "edu-blank",
            institution: { en: "Ankara Science University", tr: "Ankara Bilim Üniversitesi" },
            location: { en: " ", tr: "" },
          }),
        ],
      },
    });

    const en = await getPortfolioContent("en");
    expect(en.experience[0]).not.toHaveProperty("location");
    expect(en.education[0]).not.toHaveProperty("location");
  });

  it("omits location when the field is absent, matching items that never had it", async () => {
    const { getPortfolioContent } = await loadFetch({
      configured: true,
      payload: {
        experience: [
          sanityExperience({
            _id: "no-location",
            company: { en: "Acme", tr: "Acme" },
          }),
        ],
        education: [
          sanityEducation({
            _id: "edu-no-location",
            institution: { en: "Ankara Science University", tr: "Ankara Bilim Üniversitesi" },
          }),
        ],
      },
    });

    const en = await getPortfolioContent("en");
    expect(en.experience[0]).toEqual({
      company: "Acme",
      role: "Engineer",
      period: "01/2020 \u2013 02/2020",
      description: "Work.",
    });
    expect(en.education[0]).toEqual({
      id: "edu-no-location",
      institution: "Ankara Science University",
      degree: "B.Sc.",
      fieldOfStudy: "Computer Engineering",
      period: "2021 \u2013 2025",
    });
  });
});
