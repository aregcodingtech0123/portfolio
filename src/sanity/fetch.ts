import { migrationPortfolio } from "@/data/migration-portfolio";
import type { CertificateItem } from "@/data/certificates";
import type { ProjectCategory } from "@/data/projects";
import type {
  SkillCategoryId,
  SkillTierGroup,
} from "@/data/skills";
import type { ExperienceItem } from "@/types/content";
import { getSanityClient } from "@/sanity/client";
import { getImageUrl } from "@/sanity/image";
import { portfolioContentQuery } from "@/sanity/queries";
import {
  pickLocale,
  pickLocaleList,
  type AboutDisplay,
  type ContactInfoDisplay,
  type CtfDisplay,
  type HeroDisplay,
  type SanityCertificate,
  type SanityCtf,
  type SanityExperience,
  type SanityProject,
  type SanitySiteSettings,
  type SanitySkillCategory,
  type SocialLinksDisplay,
} from "@/sanity/types";
import { sanityConfigured } from "../../sanity/env";

export type ProjectDisplay = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type SkillCategoryDisplay = {
  id: SkillCategoryId;
  label: string;
  groups: SkillTierGroup[];
};

export type PortfolioContent = {
  projects: ProjectDisplay[];
  experience: ExperienceItem[];
  educationCertificates: CertificateItem[];
  participationCertificates: CertificateItem[];
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

function mapProjects(
  items: SanityProject[] | undefined,
  locale: string,
): ProjectDisplay[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    id: item.slug || item._id,
    title: pickLocale(item.title, locale),
    description: pickLocale(item.description, locale),
    technologies: item.technologies ?? [],
    category: item.category,
    githubUrl: item.githubUrl,
    liveUrl: item.liveUrl,
    imageUrl: getImageUrl(item.image, 960, 600),
    imageAlt:
      item.image?.alt ||
      pickLocale(item.title, locale) ||
      "Project preview",
  }));
}

function mapExperience(
  items: SanityExperience[] | undefined,
  locale: string,
): ExperienceItem[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    company: pickLocale(item.company, locale),
    role: pickLocale(item.role, locale),
    period: pickLocale(item.period, locale),
    detail: pickLocale(item.detail, locale),
  }));
}

function mapCertificates(items: SanityCertificate[] | undefined) {
  const education: CertificateItem[] = [];
  const participation: CertificateItem[] = [];

  for (const item of items ?? []) {
    const entry: CertificateItem = {
      name: item.name,
      issuer: item.issuer,
      date: item.date,
    };
    if (item.category === "participation") participation.push(entry);
    else education.push(entry);
  }

  return { education, participation };
}

function mapCtfs(items: SanityCtf[] | undefined): CtfDisplay[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    id: item.slug || item._id,
    slug: item.slug,
    title: item.title,
    platform: item.platform,
    difficulty: item.difficulty,
    dateSolved: item.dateSolved,
    tools: item.tools ?? [],
    imageUrl: getImageUrl(item.coverImage, 640, 400),
    imageAlt: item.coverImage?.alt || item.title,
    hasWriteup: Array.isArray(item.writeup) && item.writeup.length > 0,
  }));
}

function mapSkillCategories(
  items: SanitySkillCategory[] | undefined,
  locale: string,
): SkillCategoryDisplay[] {
  if (!items?.length) return [];
  return items.map((item) => ({
    id: item.categoryId,
    label: pickLocale(item.label, locale),
    groups: item.groups ?? [],
  }));
}

function mapHero(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): HeroDisplay {
  const fallback = migrationPortfolio.siteSettings.hero;
  const hero = settings?.hero;

  return {
    greeting: pickLocale(hero?.greeting ?? fallback.greeting, locale),
    name: pickLocale(hero?.name ?? fallback.name, locale),
    rolePrefix: pickLocale(hero?.rolePrefix ?? fallback.rolePrefix, locale),
    ctaProjects: pickLocale(hero?.ctaProjects ?? fallback.ctaProjects, locale),
    ctaContact: pickLocale(hero?.ctaContact ?? fallback.ctaContact, locale),
    badges: {
      ai: pickLocale(hero?.badges?.ai ?? fallback.badges.ai, locale),
      fullstack: pickLocale(
        hero?.badges?.fullstack ?? fallback.badges.fullstack,
        locale,
      ),
      security: pickLocale(
        hero?.badges?.security ?? fallback.badges.security,
        locale,
      ),
    },
    typingRoles:
      pickLocaleList(hero?.typingRoles, locale).length > 0
        ? pickLocaleList(hero?.typingRoles, locale)
        : fallback.typingRoles.map((r) => pickLocale(r, locale)),
    profileTagline: pickLocale(
      hero?.profileTagline ?? fallback.profileTagline,
      locale,
    ),
  };
}

function mapAbout(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): AboutDisplay {
  const fb = migrationPortfolio.siteSettings;
  const about = settings?.about;
  const highlightsSource =
    settings?.aboutHighlights?.length
      ? settings.aboutHighlights
      : fb.aboutHighlights;

  return {
    summary: pickLocale(about?.summary ?? fb.about.summary, locale),
    location: pickLocale(settings?.location ?? fb.location, locale),
    edu1: pickLocale(about?.edu1 ?? fb.about.edu1, locale),
    edu2: pickLocale(about?.edu2 ?? fb.about.edu2, locale),
    experienced: pickLocale(about?.experienced ?? fb.about.experienced, locale),
    highlights: highlightsSource
      .map((h) => pickLocale(h.text, locale))
      .filter(Boolean),
    stats: {
      focus: pickLocale(about?.stats?.focus ?? fb.about.stats.focus, locale),
      focusValue: pickLocale(
        about?.stats?.focusValue ?? fb.about.stats.focusValue,
        locale,
      ),
      stack: pickLocale(about?.stats?.stack ?? fb.about.stats.stack, locale),
      stackValue: pickLocale(
        about?.stats?.stackValue ?? fb.about.stats.stackValue,
        locale,
      ),
      mindset: pickLocale(
        about?.stats?.mindset ?? fb.about.stats.mindset,
        locale,
      ),
      mindsetValue: pickLocale(
        about?.stats?.mindsetValue ?? fb.about.stats.mindsetValue,
        locale,
      ),
    },
  };
}

function mapContact(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): ContactInfoDisplay {
  const fb = migrationPortfolio.siteSettings;
  return {
    email: settings?.email ?? fb.email,
    location: pickLocale(settings?.location ?? fb.location, locale),
  };
}

function mapSocial(
  settings: SanitySiteSettings | null | undefined,
): SocialLinksDisplay {
  const fb = migrationPortfolio.siteSettings;
  return {
    github: settings?.githubUrl ?? fb.githubUrl,
    linkedin: settings?.linkedinUrl ?? fb.linkedinUrl,
  };
}

function buildFallbackContent(locale: string): PortfolioContent {
  const { siteSettings } = migrationPortfolio;

  return {
    projects: migrationPortfolio.projects.map((p) => ({
      id: p.id,
      title: pickLocale(p.title, locale),
      description: pickLocale(p.description, locale),
      technologies: p.technologies,
      category: p.category,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
    })),
    experience: migrationPortfolio.experience.map((e) => ({
      company: pickLocale(e.company, locale),
      role: pickLocale(e.role, locale),
      period: pickLocale(e.period, locale),
      detail: pickLocale(e.detail, locale),
    })),
    educationCertificates: migrationPortfolio.educationCertificates,
    participationCertificates: migrationPortfolio.participationCertificates,
    skillCategories: migrationPortfolio.skillCategories.map((cat) => ({
      id: cat.id,
      label: pickLocale(cat.label, locale),
      groups: cat.groups,
    })),
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

function mergeWithFallback(
  locale: string,
  data: {
    projects?: SanityProject[];
    experience?: SanityExperience[];
    certificates?: SanityCertificate[];
    skillCategories?: SanitySkillCategory[];
    siteSettings?: SanitySiteSettings | null;
    ctfs?: SanityCtf[];
  },
): PortfolioContent {
  const fallback = buildFallbackContent(locale);
  const { education, participation } = mapCertificates(data.certificates);
  const mappedProjects = mapProjects(data.projects, locale);
  const mappedExperience = mapExperience(data.experience, locale);
  const mappedSkills = mapSkillCategories(data.skillCategories, locale);
  const mappedCtfs = mapCtfs(data.ctfs);
  const settings = data.siteSettings ?? null;

  return {
    projects: mappedProjects.length > 0 ? mappedProjects : fallback.projects,
    experience:
      mappedExperience.length > 0 ? mappedExperience : fallback.experience,
    educationCertificates:
      education.length > 0 ? education : fallback.educationCertificates,
    participationCertificates:
      participation.length > 0
        ? participation
        : fallback.participationCertificates,
    skillCategories:
      mappedSkills.length > 0 ? mappedSkills : fallback.skillCategories,
    ctfs: mappedCtfs,
    hero: mapHero(settings, locale),
    about: mapAbout(settings, locale),
    contact: mapContact(settings, locale),
    social: mapSocial(settings),
    siteName: settings?.siteName ?? fallback.siteName,
    seoDescription:
      pickLocale(settings?.seo?.homeDescription, locale) ||
      fallback.seoDescription,
    source: "sanity",
  };
}

export async function getPortfolioContent(
  locale: string,
): Promise<PortfolioContent> {
  const client = getSanityClient();

  if (!sanityConfigured || !client) {
    return buildFallbackContent(locale);
  }

  try {
    const data = await client.fetch<{
      projects?: SanityProject[];
      experience?: SanityExperience[];
      certificates?: SanityCertificate[];
      skillCategories?: SanitySkillCategory[];
      siteSettings?: SanitySiteSettings | null;
      ctfs?: SanityCtf[];
    }>(portfolioContentQuery);

    const hasStructuredContent =
      (data.projects?.length ?? 0) > 0 ||
      (data.experience?.length ?? 0) > 0 ||
      (data.certificates?.length ?? 0) > 0 ||
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
