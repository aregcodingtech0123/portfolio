import { migrationPortfolio } from "@/data/migration-portfolio";
import { getSanityClient } from "@/sanity/client";
import { getImageUrl } from "@/sanity/image";
import { portfolioContentQuery } from "@/sanity/queries";
import {
  pickLocale,
  pickLocaleList,
  type AboutDisplay,
  type CertificateDisplay,
  type ContactInfoDisplay,
  type CtfDisplay,
  type HeroDisplay,
  type LocaleField,
  type ProjectDisplay,
  type SanityCertificate,
  type SanityCtf,
  type SanityExperience,
  type SanityImageAsset,
  type SanityProject,
  type SanitySiteSettings,
  type SanitySkill,
  type SanitySkillCategory,
  type SkillCategoryDisplay,
  type SkillCategoryId,
  type SkillDisplay,
  type SkillTierGroupDisplay,
  type SkillTierId,
  type SocialLinksDisplay,
} from "@/sanity/types";
import type { ExperienceItem } from "@/types/content";
import { sanityConfigured } from "../../sanity/env";

export type {
  ProjectDisplay,
  SkillCategoryDisplay,
  CtfDisplay,
  CertificateDisplay,
} from "@/sanity/types";

export type PortfolioContent = {
  projects: ProjectDisplay[];
  experience: ExperienceItem[];
  educationCertificates: CertificateDisplay[];
  participationCertificates: CertificateDisplay[];
  skillCategories: SkillCategoryDisplay[];
  ctfs: CtfDisplay[];
  hero: HeroDisplay;
  about: AboutDisplay;
  contact: ContactInfoDisplay;
  social: SocialLinksDisplay;
  siteName: string;
  seoDescription: string;
  source: "sanity" | "fallback";
};

const fallback = migrationPortfolio;
const TIER_ORDER: SkillTierId[] = ["expertise", "comfortable", "learning"];

/** Shape shared by Sanity projects and fallback seeds. `id` is the slug or the seed id. */
type ProjectSource = Omit<SanityProject, "_id" | "slug" | "image"> & {
  id: string;
  image?: SanityImageAsset;
};

function toProjectDisplay(p: ProjectSource, locale: string): ProjectDisplay {
  const title = pickLocale(p.title, locale);
  return {
    id: p.id,
    code: p.code,
    status: p.status,
    title,
    description: pickLocale(p.description, locale),
    problem: pickLocale(p.problem, locale) || undefined,
    approach: pickLocale(p.approach, locale) || undefined,
    challenge: pickLocale(p.challenge, locale) || undefined,
    learned: pickLocale(p.learned, locale) || undefined,
    technologies: p.technologies ?? [],
    category: p.category,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    imageUrl: p.image ? getImageUrl(p.image, 960, 600) : undefined,
    imageAlt: p.image?.alt || title || "Project preview",
    featured: p.featured !== false,
  };
}

type ExperienceSource = Pick<SanityExperience, "company" | "role" | "period" | "detail">;

function mapExperience(
  items: readonly ExperienceSource[] | undefined,
  locale: string,
): ExperienceItem[] {
  return (items ?? []).map((item) => ({
    company: pickLocale(item.company, locale),
    role: pickLocale(item.role, locale),
    period: pickLocale(item.period, locale),
    detail: pickLocale(item.detail, locale),
  }));
}

/** Certificates with a legacy plain `name` still display; `title` wins when present. */
function toCertificateDisplay(
  item: {
    title?: LocaleField | string;
    legacyName?: string;
    issuer?: LocaleField | string;
    date?: string;
  },
  locale: string,
): CertificateDisplay {
  return {
    title: pickLocale(item.title, locale) || item.legacyName || "",
    issuer: pickLocale(item.issuer, locale),
    date: item.date,
  };
}

function splitCertificates(
  items: (SanityCertificate & { legacyName?: string })[] | undefined,
  locale: string,
) {
  const education: CertificateDisplay[] = [];
  const participation: CertificateDisplay[] = [];
  for (const item of items ?? []) {
    const entry = toCertificateDisplay(
      { ...item, legacyName: item.legacyName ?? item.name },
      locale,
    );
    if (item.category === "participation") participation.push(entry);
    else education.push(entry);
  }
  return { education, participation };
}

function mapCtfs(items: SanityCtf[] | undefined): CtfDisplay[] {
  return (items ?? []).map((item) => ({
    id: item.slug || item._id,
    slug: item.slug,
    title: item.title,
    platform: item.platform,
    difficulty: item.difficulty,
    dateSolved: item.dateSolved,
    eventName: item.eventName || undefined,
    category: item.category || undefined,
    placement: item.placement || undefined,
    writeupUrl: item.writeupUrl || undefined,
    tools: item.tools ?? [],
    imageUrl: item.coverImage ? getImageUrl(item.coverImage, 640, 400) : undefined,
    imageAlt: item.coverImage?.alt || item.title,
    hasWriteup: Boolean(item.writeupUrl) || (Array.isArray(item.writeup) && item.writeup.length > 0),
  }));
}

/** Skill evidence anchors point at the section that lists the evidence. */
function evidenceFor(
  evidence: { _type: "project" | "ctf"; slug?: string; title?: LocaleField | string } | null | undefined,
  locale: string,
): Pick<SkillDisplay, "evidenceTitle" | "evidenceHref"> {
  if (!evidence) return {};
  return {
    evidenceTitle: pickLocale(evidence.title, locale) || undefined,
    evidenceHref: evidence._type === "project" ? "#projects" : "#ctf",
  };
}

/**
 * Builds category → tier → skill groups. Categories with no skills are dropped.
 * Skills are sorted by their own order inside each tier.
 */
function buildSkillCategories(
  categories: { id: SkillCategoryId; label: LocaleField; order: number }[],
  skills: { categoryId: SkillCategoryId; tier: SkillTierId; order: number; display: SkillDisplay }[],
  locale: string,
): SkillCategoryDisplay[] {
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .map((cat) => {
      const groups: SkillTierGroupDisplay[] = TIER_ORDER.map((tier) => ({
        tier,
        skills: skills
          .filter((s) => s.categoryId === cat.id && s.tier === tier)
          .sort((a, b) => a.order - b.order)
          .map((s) => s.display),
      })).filter((g) => g.skills.length > 0);
      return { id: cat.id, label: pickLocale(cat.label, locale), groups };
    })
    .filter((cat) => cat.groups.length > 0);
}

function fallbackSkillCategories(locale: string): SkillCategoryDisplay[] {
  const projectTitle = (id: string) =>
    fallback.projects.find((p) => p.id === id);
  return buildSkillCategories(
    fallback.skillCategories,
    fallback.skills.map((s) => ({
      categoryId: s.categoryId,
      tier: s.tier,
      order: s.order,
      display: {
        name: s.name,
        level: s.level,
        ...(s.evidenceProjectId
          ? {
              evidenceTitle: pickLocale(projectTitle(s.evidenceProjectId)?.title, locale),
              evidenceHref: "#projects",
            }
          : {}),
      },
    })),
    locale,
  );
}

function sanitySkillCategories(
  categoryDocs: SanitySkillCategory[],
  skillDocs: SanitySkill[],
  locale: string,
): SkillCategoryDisplay[] {
  const categories = categoryDocs.map((c) => ({
    id: c.categoryId,
    label: c.label,
    order: c.order,
  }));

  // Prefer per-skill documents. Fall back to legacy group lists only when none exist.
  if (skillDocs.length > 0) {
    return buildSkillCategories(
      categories,
      skillDocs.map((s) => ({
        categoryId: s.categoryId,
        tier: s.tier,
        order: s.order,
        display: {
          name: s.name,
          level: s.level,
          ...evidenceFor(s.evidence, locale),
        },
      })),
      locale,
    );
  }

  return categoryDocs
    .sort((a, b) => a.order - b.order)
    .map((cat) => ({
      id: cat.categoryId,
      label: pickLocale(cat.label, locale),
      groups: (cat.groups ?? []).map((g) => ({
        tier: g.tier,
        skills: g.skills.map((name) => ({ name })),
      })),
    }))
    .filter((cat) => cat.groups.length > 0);
}

function mapHero(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): HeroDisplay {
  const fb = fallback.siteSettings.hero;
  const hero = settings?.hero;
  const roles = pickLocaleList(hero?.typingRoles, locale);

  return {
    greeting: pickLocale(hero?.greeting ?? fb.greeting, locale),
    eyebrow: pickLocale(hero?.eyebrow ?? fb.eyebrow, locale),
    name: pickLocale(hero?.name ?? fb.name, locale),
    rolePrefix: pickLocale(hero?.rolePrefix ?? fb.rolePrefix, locale),
    headline: pickLocale(hero?.headline ?? fb.headline, locale),
    subline: pickLocale(hero?.subline ?? fb.subline, locale),
    ctaProjects: pickLocale(hero?.ctaProjects ?? fb.ctaProjects, locale),
    ctaContact: pickLocale(hero?.ctaContact ?? fb.ctaContact, locale),
    badges: {
      ai: pickLocale(hero?.badges?.ai ?? fb.badges.ai, locale),
      fullstack: pickLocale(hero?.badges?.fullstack ?? fb.badges.fullstack, locale),
      security: pickLocale(hero?.badges?.security ?? fb.badges.security, locale),
    },
    typingRoles:
      roles.length > 0
        ? roles
        : fb.typingRoles.map((r) => pickLocale(r, locale)),
    profileTagline: pickLocale(hero?.profileTagline ?? fb.profileTagline, locale),
  };
}

function mapAbout(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): AboutDisplay {
  const fb = fallback.siteSettings;
  const about = settings?.about;
  const highlightsSource =
    settings?.aboutHighlights?.length ? settings.aboutHighlights : fb.aboutHighlights;
  const paragraphs = about?.paragraphs ?? fb.about.paragraphs;

  return {
    summary: pickLocale(about?.summary ?? fb.about.summary, locale),
    paragraphs: paragraphs.map((p) => pickLocale(p, locale)).filter(Boolean),
    location: pickLocale(settings?.location ?? fb.location, locale),
    edu1: pickLocale(about?.edu1 ?? fb.about.edu1, locale),
    edu2: pickLocale(about?.edu2 ?? fb.about.edu2, locale),
    experienced: pickLocale(about?.experienced ?? fb.about.experienced, locale),
    highlights: highlightsSource.map((h) => pickLocale(h.text, locale)).filter(Boolean),
    stats: {
      focus: pickLocale(about?.stats?.focus ?? fb.about.stats.focus, locale),
      focusValue: pickLocale(about?.stats?.focusValue ?? fb.about.stats.focusValue, locale),
      stack: pickLocale(about?.stats?.stack ?? fb.about.stats.stack, locale),
      stackValue: pickLocale(about?.stats?.stackValue ?? fb.about.stats.stackValue, locale),
      mindset: pickLocale(about?.stats?.mindset ?? fb.about.stats.mindset, locale),
      mindsetValue: pickLocale(about?.stats?.mindsetValue ?? fb.about.stats.mindsetValue, locale),
    },
  };
}

/** Known placeholder addresses that must never reach the page. */
const BANNED_EMAIL_PATTERN = /@example\.(com|org|net)$/i;

function mapContact(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): ContactInfoDisplay {
  // An empty email is valid: the contact block hides itself rather than showing a placeholder.
  const email = (settings?.email ?? fallback.siteSettings.email).trim();
  if (process.env.NODE_ENV !== "production" && BANNED_EMAIL_PATTERN.test(email)) {
    throw new Error(
      `Placeholder contact email "${email}" reached mapContact(); fix the Sanity siteSettings or fallback data instead of shipping it.`,
    );
  }
  return {
    email,
    location: pickLocale(settings?.location ?? fallback.siteSettings.location, locale),
  };
}

function mapSocial(settings: SanitySiteSettings | null | undefined): SocialLinksDisplay {
  return {
    github: settings?.githubUrl ?? fallback.siteSettings.githubUrl,
    linkedin: settings?.linkedinUrl ?? fallback.siteSettings.linkedinUrl,
  };
}

function fallbackProjects(locale: string): ProjectDisplay[] {
  return fallback.projects.map((p) =>
    toProjectDisplay(
      {
        ...p,
        image: undefined,
      },
      locale,
    ),
  );
}

function buildFallbackContent(locale: string): PortfolioContent {
  const { siteSettings } = fallback;
  const certs = {
    education: fallback.educationCertificates.map((c) => toCertificateDisplay(c, locale)),
    participation: fallback.participationCertificates.map((c) => toCertificateDisplay(c, locale)),
  };

  return {
    projects: fallbackProjects(locale),
    experience: mapExperience(fallback.experience, locale),
    educationCertificates: certs.education,
    participationCertificates: certs.participation,
    skillCategories: fallbackSkillCategories(locale),
    ctfs: [],
    hero: mapHero(null, locale),
    about: mapAbout(null, locale),
    contact: mapContact(null, locale),
    social: mapSocial(null),
    siteName: siteSettings.siteName,
    seoDescription: pickLocale(siteSettings.seo.homeDescription, locale),
    source: "fallback",
  };
}

type SanityPayload = {
  projects?: (SanityProject)[];
  experience?: SanityExperience[];
  certificates?: (SanityCertificate & { legacyName?: string })[];
  skills?: SanitySkill[];
  skillCategories?: SanitySkillCategory[];
  siteSettings?: SanitySiteSettings | null;
  ctfs?: SanityCtf[];
};

function mergeWithFallback(locale: string, data: SanityPayload): PortfolioContent {
  const fb = buildFallbackContent(locale);
  const certs = splitCertificates(data.certificates, locale);
  const projects = (data.projects ?? []).map((p) =>
    toProjectDisplay({ ...p, id: p.slug || p._id }, locale),
  );
  const experience = mapExperience(data.experience, locale);
  const skillCategories = sanitySkillCategories(
    data.skillCategories ?? [],
    data.skills ?? [],
    locale,
  );
  const settings = data.siteSettings ?? null;

  return {
    projects: projects.length ? projects : fb.projects,
    experience: experience.length ? experience : fb.experience,
    educationCertificates: certs.education.length ? certs.education : fb.educationCertificates,
    participationCertificates: certs.participation.length
      ? certs.participation
      : fb.participationCertificates,
    skillCategories: skillCategories.length ? skillCategories : fb.skillCategories,
    // CTFs have no fallback on purpose: an empty list means the section is hidden.
    ctfs: mapCtfs(data.ctfs),
    hero: mapHero(settings, locale),
    about: mapAbout(settings, locale),
    contact: mapContact(settings, locale),
    social: mapSocial(settings),
    siteName: settings?.siteName ?? fb.siteName,
    seoDescription: pickLocale(settings?.seo?.homeDescription, locale) || fb.seoDescription,
    source: "sanity",
  };
}

export async function getPortfolioContent(locale: string): Promise<PortfolioContent> {
  const client = getSanityClient();

  if (!sanityConfigured || !client) {
    return buildFallbackContent(locale);
  }

  try {
    const data = await client.fetch<SanityPayload>(portfolioContentQuery);

    const hasStructuredContent =
      (data.projects?.length ?? 0) > 0 ||
      (data.experience?.length ?? 0) > 0 ||
      (data.certificates?.length ?? 0) > 0 ||
      (data.skills?.length ?? 0) > 0 ||
      (data.skillCategories?.length ?? 0) > 0 ||
      Boolean(data.siteSettings);

    if (!hasStructuredContent) {
      return buildFallbackContent(locale);
    }

    return mergeWithFallback(locale, data);
  } catch (error) {
    console.error("[Sanity] Failed to fetch portfolio content:", error);
    return buildFallbackContent(locale);
  }
}
