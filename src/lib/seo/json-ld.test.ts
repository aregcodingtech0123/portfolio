import { describe, expect, it } from "vitest";
import type { OwnerIdentity } from "./identity";
import {
  buildJsonLd,
  confirmedSameAs,
  evidencedTopics,
  serializeJsonLd,
  type JsonLdContent,
  type JsonLdInput,
} from "./json-ld";

const GITHUB = "https://github.com/owner-handle";
const LINKEDIN = "https://www.linkedin.com/in/owner-handle/";

const identity: OwnerIdentity = {
  jobTitle: { en: "Computer Engineer", tr: "Bilgisayar Mühendisi" },
  confirmedProfileUrls: [GITHUB],
  completedDegreeIds: ["edu-done"],
  portraitAllowed: true,
};

function content(overrides: Partial<JsonLdContent> = {}): JsonLdContent {
  return {
    siteName: "Site Name",
    hero: { name: "Person Name" } as JsonLdContent["hero"],
    about: { summary: "Visible summary.", location: "City, Country" } as JsonLdContent["about"],
    social: { github: GITHUB, linkedin: LINKEDIN },
    education: [
      { id: "edu-done", institution: "Finished University", degree: "B.Sc.", fieldOfStudy: "CE", period: "2021 – 2025" },
      { id: "edu-left", institution: "Left University", degree: "Undergraduate", fieldOfStudy: "Econ", period: "2020 – 2021" },
    ],
    skillCategories: [
      {
        id: "frontend",
        label: "Frontend",
        skills: [
          { name: "Next.js", evidenceTitle: "Project A", evidenceHref: "#projects" },
          { name: "Unproven Skill", tier: "expertise" },
        ],
      },
    ],
    projects: [
      { id: "a", title: "A", description: "", technologies: ["Next.js", "Gemini API"], category: "ai", featured: true, status: "live" },
      { id: "b", title: "B", description: "", technologies: ["Draft Tech"], category: "ai", featured: false, status: "wip" },
    ],
    ...overrides,
  };
}

function input(overrides: Partial<JsonLdInput> = {}): JsonLdInput {
  return {
    locale: "en",
    base: new URL("https://example.dev"),
    content: content(),
    identity,
    portraitSrc: "/images/portrait.jpeg",
    ...overrides,
  };
}

function person(graph: ReturnType<typeof buildJsonLd>) {
  const node = graph["@graph"].find((n) => n["@type"] === "Person");
  if (!node) throw new Error("no Person node");
  return node;
}

describe("buildJsonLd", () => {
  it("emits one graph of WebSite, ProfilePage and Person, linked by @id", () => {
    const graph = buildJsonLd(input());
    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@graph"].map((n) => n["@type"])).toEqual(["WebSite", "ProfilePage", "Person"]);
    const [website, page, p] = graph["@graph"];
    expect(website).toMatchObject({ url: "https://example.dev/", name: "Site Name", inLanguage: ["en", "tr"], author: { "@id": "https://example.dev/#person" } });
    expect(page).toMatchObject({ url: "https://example.dev/en", inLanguage: "en", mainEntity: { "@id": p["@id"] }, isPartOf: { "@id": website["@id"] } });
  });

  it("builds the Person from visible content and confirmed identity only", () => {
    expect(person(buildJsonLd(input()))).toEqual({
      "@type": "Person",
      "@id": "https://example.dev/#person",
      name: "Person Name",
      url: "https://example.dev/",
      jobTitle: "Computer Engineer",
      description: "Visible summary.",
      homeLocation: { "@type": "Place", name: "City, Country" },
      image: "https://example.dev/images/portrait.jpeg",
      alumniOf: [{ "@type": "CollegeOrUniversity", name: "Finished University" }],
      sameAs: [GITHUB],
      knowsAbout: ["Next.js", "Gemini API"],
    });
  });

  it("uses the locale's job title and page URL, keeping the same Person @id", () => {
    const en = buildJsonLd(input({ locale: "en" }));
    const trGraph = buildJsonLd(input({ locale: "tr" }));
    expect(person(trGraph).jobTitle).toBe("Bilgisayar Mühendisi");
    expect(trGraph["@graph"][1].url).toBe("https://example.dev/tr");
    expect(person(trGraph)["@id"]).toBe(person(en)["@id"]);
  });

  it("never emits an email: not when it is empty, not even when the content has one", () => {
    for (const email of ["", "owner@example.dev"]) {
      const withContact = { ...content(), contact: { email, location: "" } } as JsonLdContent;
      const json = JSON.stringify(buildJsonLd(input({ content: withContact })));
      expect(json).not.toMatch(/email|telephone|owner@example\.dev/i);
    }
  });

  it("has no image without a portrait file, or when the owner did not allow it", () => {
    expect(person(buildJsonLd(input({ portraitSrc: undefined })))).not.toHaveProperty("image");
    expect(
      person(buildJsonLd(input({ identity: { ...identity, portraitAllowed: false } }))),
    ).not.toHaveProperty("image");
  });

  it("omits properties whose source is empty", () => {
    const p = person(
      buildJsonLd(
        input({
          content: content({
            about: { summary: " ", location: "" } as JsonLdContent["about"],
            social: { github: "", linkedin: "" },
            education: [],
            skillCategories: [],
            projects: [],
          }),
        }),
      ),
    );
    for (const key of ["description", "homeLocation", "sameAs", "alumniOf", "knowsAbout"]) {
      expect(p).not.toHaveProperty(key);
    }
  });

  it("never asserts what the page does not show", () => {
    const json = JSON.stringify(buildJsonLd(input()));
    for (const forbidden of [
      "worksFor",
      "email",
      "telephone",
      "birthDate",
      "FAQPage",
      "aggregateRating",
      "AggregateRating",
      "review",
      "Review",
      "SearchAction",
      "potentialAction",
      "Event",
      "SoftwareSourceCode",
    ]) {
      expect(json).not.toContain(`"${forbidden}"`);
    }
  });
});

describe("evidencedTopics", () => {
  it("takes skills with evidence and technologies of live projects, deduplicated", () => {
    expect(evidencedTopics(content())).toEqual(["Next.js", "Gemini API"]);
  });

  it("leaves out skills without evidence and work-in-progress projects", () => {
    const topics = evidencedTopics(content());
    expect(topics).not.toContain("Unproven Skill");
    expect(topics).not.toContain("Draft Tech");
  });
});

describe("confirmedSameAs", () => {
  it("keeps only confirmed profiles, ignoring a trailing slash and case", () => {
    expect(confirmedSameAs({ github: `${GITHUB}/`, linkedin: LINKEDIN }, [GITHUB.toUpperCase()])).toEqual([`${GITHUB}/`]);
  });

  it("drops a link that differs from the confirmed one", () => {
    expect(confirmedSameAs({ github: "https://github.com/someone-else", linkedin: "" }, [GITHUB])).toEqual([]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so content cannot close the script element, and stays valid JSON", () => {
    const graph = buildJsonLd(
      input({ content: content({ about: { summary: "</script><script>alert(1)</script>", location: "" } as JsonLdContent["about"] }) }),
    );
    const text = serializeJsonLd(graph);
    expect(text).not.toContain("<");
    expect(text).toContain("\\u003c/script>");
    expect(person(JSON.parse(text)).description).toBe("</script><script>alert(1)</script>");
  });
});
