import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { migrationPortfolio } from "@/data/migration-portfolio";
import type { SanityCtf, SanityProject, SanitySiteSettings } from "@/sanity/types";

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
