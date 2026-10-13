/**
 * Structured data (JSON-LD) for the home page: one @graph with WebSite,
 * ProfilePage and the Person it is about.
 *
 * Pure: it takes the content and the owner-confirmed identity and returns
 * plain data, so every rule is unit-tested (json-ld.test.ts). The page
 * renders it as an inline data block from the server component, so it is in
 * the static HTML and adds no client JavaScript.
 *
 * Rule: assert only what the page visibly says, and only what the owner
 * confirmed. Every property is omitted when its source is empty. Never added,
 * because nothing on the page supports them: worksFor, email, telephone,
 * birthDate, FAQPage, ratings, reviews, SearchAction, Event,
 * SoftwareSourceCode.
 */
import { routing } from "@/i18n/routing";
import type { PortfolioContent } from "@/sanity/fetch";
import type { OwnerIdentity } from "./identity";
import { absoluteUrl, type SiteLocale } from "./site";

export type JsonLdContent = Pick<
  PortfolioContent,
  "siteName" | "hero" | "about" | "social" | "education" | "skillCategories" | "projects"
>;

export type JsonLdInput = {
  locale: SiteLocale;
  base: URL;
  content: JsonLdContent;
  identity: OwnerIdentity;
  /** Site path of the hero portrait; undefined when no photo file shipped. */
  portraitSrc?: string;
};

type Node = Record<string, unknown>;

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Node[];
};

function comparableUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Topics with evidence on the page: skills linked to a project or CTF entry,
 * then the technologies listed on live projects. Order kept, case-insensitive
 * duplicates dropped. Skills without evidence are left out, whatever their
 * tier label says.
 */
export function evidencedTopics(content: Pick<JsonLdContent, "skillCategories" | "projects">): string[] {
  const topics: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const topic = raw.trim();
    const key = topic.toLowerCase();
    if (!topic || seen.has(key)) return;
    seen.add(key);
    topics.push(topic);
  };
  for (const category of content.skillCategories) {
    for (const skill of category.skills) {
      if (skill.evidenceTitle) add(skill.name);
    }
  }
  for (const project of content.projects) {
    if (project.status === "live") project.technologies.forEach(add);
  }
  return topics;
}

/** Visible social links that the owner confirmed as their own profiles. */
export function confirmedSameAs(
  social: JsonLdContent["social"],
  confirmed: readonly string[],
): string[] {
  const allowed = new Set(confirmed.map(comparableUrl));
  return [social.github, social.linkedin].filter(
    (url): url is string => Boolean(url) && allowed.has(comparableUrl(url)),
  );
}

export function buildJsonLd({ locale, base, content, identity, portraitSrc }: JsonLdInput): JsonLdGraph {
  const root = absoluteUrl("/", base);
  const pageUrl = absoluteUrl(`/${locale}`, base);
  const personId = `${root}#person`;
  const websiteId = `${root}#website`;

  const name = content.hero.name.trim() || content.siteName;
  const description = content.about.summary.trim();
  const location = content.about.location.trim();
  const sameAs = confirmedSameAs(content.social, identity.confirmedProfileUrls);
  const knowsAbout = evidencedTopics(content);
  const alumniOf = content.education
    .filter((entry) => identity.completedDegreeIds.includes(entry.id) && entry.institution)
    .map((entry) => ({ "@type": "CollegeOrUniversity", name: entry.institution }));

  const person: Node = {
    "@type": "Person",
    "@id": personId,
    name,
    url: root,
    jobTitle: identity.jobTitle[locale],
    ...(description ? { description } : {}),
    ...(location ? { homeLocation: { "@type": "Place", name: location } } : {}),
    ...(identity.portraitAllowed && portraitSrc ? { image: absoluteUrl(portraitSrc, base) } : {}),
    ...(alumniOf.length > 0 ? { alumniOf } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: root,
        name: content.siteName,
        inLanguage: [...routing.locales],
        author: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": `${pageUrl}#profilepage`,
        url: pageUrl,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
      },
      person,
    ],
  };
}

/**
 * JSON for an inline <script type="application/ld+json">. "<" is escaped so
 * content can never close the script element (e.g. "</script>" in a Sanity
 * field); JSON parsers read < back as "<".
 */
export function serializeJsonLd(data: JsonLdGraph): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
