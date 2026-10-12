import { migrationPortfolio } from "@/data/migration-portfolio";
import { isSafeExternalHref } from "@/lib/mailto";
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
  type EducationDisplay,
  type HeroDisplay,
  type LocaleField,
  type ProjectDisplay,
  type SanityCertificate,
  type SanityCtf,
  type SanityEducation,
  type SanityExperience,
  type SanityImageAsset,
  type SanityProject,
  type SanitySiteSettings,
  type SanitySkill,
  type SkillCategoryDisplay,
  type SkillCategoryId,
  type SkillDisplay,
  type SocialLinksDisplay,
} from "@/sanity/types";
import type { EducationItem, ExperienceItem } from "@/types/content";
import { sanityConfigured } from "../../sanity/env";

export type {
  ProjectDisplay,
  SkillCategoryDisplay,
  CtfDisplay,
  CertificateDisplay,
  EducationDisplay,
} from "@/sanity/types";

export type PortfolioContent = {
  projects: ProjectDisplay[];
  experience: ExperienceItem[];
  education: EducationItem[];
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

/** Known category keys → bilingual labels (used when grouping skills). */
const CATEGORY_LABELS: Record<string, LocaleField> = {
  ai: { en: "AI & Machine Learning", tr: "Yapay Zeka ve Makine Öğrenmesi" },
  frontend: { en: "Frontend Development", tr: "Frontend Geliştirme" },
  backend: { en: "Backend Development", tr: "Backend Geliştirme" },
  security: { en: "Cybersecurity", tr: "Siber Güvenlik" },
  languages: { en: "Languages & Tools", tr: "Diller ve Araçlar" },
};

/** Canonical English skill names → Turkish display labels for /tr. */
const SKILL_NAME_TR: Record<string, string> = {
  "Penetration Testing": "Sızma Testi",
  "Vulnerability Scanning": "Zafiyet Tarama",
  "Cloud Security": "Bulut Güvenliği",
  "Web Animations": "Web Animasyonları",
  "Vector Databases": "Vektör Veritabanları",
};

function localizeSkillName(name: string, locale: string): string {
  if (locale !== "tr") return name;
  return SKILL_NAME_TR[name] ?? name;
}

function localizeCategoryLabel(category: string, locale: string): string {
  const known = CATEGORY_LABELS[category];
  if (known) return pickLocale(known, locale);
  return category;
}

/**
 * Treat blank strings and leftover placeholder hints as absent copy so they
 * never reach the page (including values already saved in Sanity).
 */
function usableCopy(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/\[TODO\b/i.test(trimmed) || /^TODO:/i.test(trimmed)) return "";
  return trimmed;
}

function optionalCopy(value: string): string | undefined {
  const usable = usableCopy(value);
  return usable || undefined;
}

/**
 * Links from Sanity end up as <a href> on the public page. The Studio only
 * enforces "https" in its own form; a write made through the API (or with a
 * leaked token) skips that, so the page cannot rely on it. Anything that is
 * not an absolute http(s) URL (javascript:, data:, a relative or
 * protocol-relative path, garbage) is dropped here, before it reaches a
 * component, and the field behaves as if it were empty.
 */
function safeHref(raw: string | null | undefined, field: string): string | undefined {
  const href = raw?.trim();
  if (!href) return undefined;
  if (isSafeExternalHref(href)) return href;
  console.warn(
    `[Sanity] Dropped an unsafe link in ${field}: not an absolute http(s) URL (${JSON.stringify(href.slice(0, 60))}).`,
  );
  return undefined;
}

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
    description: usableCopy(pickLocale(p.description, locale)),
    problem: optionalCopy(pickLocale(p.problem, locale)),
    approach: optionalCopy(pickLocale(p.approach, locale)),
    challenge: optionalCopy(pickLocale(p.challenge, locale)),
    learned: optionalCopy(pickLocale(p.learned, locale)),
    technologies: p.technologies ?? [],
    category: p.category,
    githubUrl: safeHref(p.githubUrl, `project ${p.id} githubUrl`),
    liveUrl: safeHref(p.liveUrl, `project ${p.id} liveUrl`),
    imageUrl: p.image ? getImageUrl(p.image, 960, 600) : undefined,
    imageAlt: p.image?.alt || title || "Project preview",
    featured: p.featured !== false,
  };
}

type ExperienceSource = Pick<
  SanityExperience,
  "company" | "role" | "period" | "description" | "detail"
>;

function mapExperience(
  items: readonly ExperienceSource[] | undefined,
  locale: string,
): ExperienceItem[] {
  return (items ?? []).map((item) => ({
    company: pickLocale(item.company, locale),
    role: pickLocale(item.role, locale),
    period: pickLocale(item.period, locale),
    description: usableCopy(
      pickLocale(item.description ?? item.detail, locale),
    ),
  }));
}

type EducationSource = {
  id: string;
  institution: LocaleField | string;
  degree: LocaleField | string;
  fieldOfStudy: LocaleField | string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
};

function formatEducationPeriod(
  startDate: string,
  endDate: string | undefined,
  isCurrent: boolean | undefined,
  locale: string,
): string {
  const start = startDate.trim();
  if (!start) return "";
  if (isCurrent) {
    const present = locale === "tr" ? "Günümüz" : "Present";
    return `${start} – ${present}`;
  }
  const end = endDate?.trim();
  return end ? `${start} – ${end}` : start;
}

function mapEducation(
  items: readonly EducationSource[] | undefined,
  locale: string,
): EducationDisplay[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    institution: usableCopy(pickLocale(item.institution, locale)),
    degree: usableCopy(pickLocale(item.degree, locale)),
    fieldOfStudy: usableCopy(pickLocale(item.fieldOfStudy, locale)),
    period: formatEducationPeriod(
      item.startDate,
      item.endDate,
      item.isCurrent,
      locale,
    ),
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
  return (items ?? []).map((item) => {
    const writeupUrl = safeHref(item.writeupUrl, `CTF ${item.slug || item._id} writeupUrl`);
    return {
      id: item.slug || item._id,
      slug: item.slug,
      title: item.title,
      platform: item.platform,
      difficulty: item.difficulty,
      dateSolved: item.dateSolved,
      eventName: item.eventName || undefined,
      category: item.category || undefined,
      placement: item.placement || undefined,
      writeupUrl,
      tools: item.tools ?? [],
      imageUrl: item.coverImage ? getImageUrl(item.coverImage, 640, 400) : undefined,
      imageAlt: item.coverImage?.alt || item.title,
      hasWriteup: Boolean(writeupUrl) || (Array.isArray(item.writeup) && item.writeup.length > 0),
    };
  });
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

type SkillForGrouping = {
  category: SkillCategoryId;
  categoryOrder: number;
  order: number;
  featured?: boolean;
  display: SkillDisplay;
};

/**
 * Groups flat skill rows by `category`, sorted by `categoryOrder` then
 * featured / skill `order` within each category.
 */
function groupSkillsByCategory(
  skills: SkillForGrouping[],
  locale: string,
): SkillCategoryDisplay[] {
  const byCategory = new Map<
    string,
    { categoryOrder: number; skills: SkillForGrouping[] }
  >();

  for (const skill of skills) {
    const key = String(skill.category || "").trim();
    if (!key) continue;
    const existing = byCategory.get(key);
    if (existing) {
      existing.categoryOrder = Math.min(existing.categoryOrder, skill.categoryOrder);
      existing.skills.push(skill);
    } else {
      byCategory.set(key, {
        categoryOrder: skill.categoryOrder,
        skills: [skill],
      });
    }
  }

  return [...byCategory.entries()]
    .sort((a, b) => a[1].categoryOrder - b[1].categoryOrder || a[0].localeCompare(b[0]))
    .map(([id, group]) => ({
      id,
      label: localizeCategoryLabel(id, locale),
      skills: group.skills
        .sort(
          (a, b) =>
            Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
            a.order - b.order,
        )
        .map((s) => s.display),
    }))
    .filter((cat) => cat.skills.length > 0);
}

function fallbackSkillCategories(locale: string): SkillCategoryDisplay[] {
  const projectTitle = (id: string) =>
    fallback.projects.find((p) => p.id === id);
  return groupSkillsByCategory(
    fallback.skills.map((s) => ({
      category: s.category,
      categoryOrder: s.categoryOrder,
      order: s.order,
      featured: s.featured,
      display: {
        name: localizeSkillName(s.name, locale),
        featured: s.featured,
        tier: s.tier,
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
  skillDocs: SanitySkill[],
  locale: string,
): SkillCategoryDisplay[] {
  return groupSkillsByCategory(
    skillDocs.map((s) => ({
      category: s.category,
      categoryOrder: s.categoryOrder ?? s.order ?? 0,
      order: s.order ?? 0,
      featured: s.featured,
      display: {
        name: localizeSkillName(s.name, locale),
        featured: s.featured,
        tier: s.tier,
        level: s.level,
        ...evidenceFor(s.evidence, locale),
      },
    })),
    locale,
  );
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
    summary: usableCopy(pickLocale(about?.summary ?? fb.about.summary, locale)),
    paragraphs: paragraphs
      .map((p) => usableCopy(pickLocale(p, locale)))
      .filter(Boolean),
    location: usableCopy(pickLocale(settings?.location ?? fb.location, locale)),
    experienced: usableCopy(
      pickLocale(about?.experienced ?? fb.about.experienced, locale),
    ),
    highlights: highlightsSource
      .map((h) => usableCopy(pickLocale(h.text, locale)))
      .filter(Boolean),
    stats: {
      focus: usableCopy(
        pickLocale(about?.stats?.focus ?? fb.about.stats.focus, locale),
      ),
      focusValue: usableCopy(
        pickLocale(about?.stats?.focusValue ?? fb.about.stats.focusValue, locale),
      ),
      stack: usableCopy(
        pickLocale(about?.stats?.stack ?? fb.about.stats.stack, locale),
      ),
      stackValue: usableCopy(
        pickLocale(
          about?.stats?.stackValue ?? fb.about.stats.stackValue,
          locale,
        ),
      ),
      mindset: usableCopy(
        pickLocale(about?.stats?.mindset ?? fb.about.stats.mindset, locale),
      ),
      mindsetValue: usableCopy(
        pickLocale(
          about?.stats?.mindsetValue ?? fb.about.stats.mindsetValue,
          locale,
        ),
      ),
    },
  };
}

/** Known placeholder addresses that must never reach the page. */
const BANNED_EMAIL_PATTERN = /@example\.(com|org|net)$/i;

function sanitizeContactEmail(raw: string): string {
  const email = raw.trim();
  if (!email) return "";
  // Strip placeholders instead of throwing: a throw here used to abort the whole
  // Sanity merge and silently fall back to migration data (missing projects/images).
  if (BANNED_EMAIL_PATTERN.test(email)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Sanity] Ignoring placeholder contact email "${email}". Set a real address in siteSettings or leave it blank.`,
      );
    }
    return "";
  }
  return email;
}

function mapContact(
  settings: SanitySiteSettings | null | undefined,
  locale: string,
): ContactInfoDisplay {
  // An empty email is valid: the contact block hides itself rather than showing a placeholder.
  const email = sanitizeContactEmail(
    settings?.email ?? fallback.siteSettings.email,
  );
  return {
    email,
    location: pickLocale(settings?.location ?? fallback.siteSettings.location, locale),
  };
}

function mapSocial(settings: SanitySiteSettings | null | undefined): SocialLinksDisplay {
  return {
    github:
      safeHref(settings?.githubUrl, "siteSettings githubUrl") ?? fallback.siteSettings.githubUrl,
    linkedin:
      safeHref(settings?.linkedinUrl, "siteSettings linkedinUrl") ??
      fallback.siteSettings.linkedinUrl,
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
    education: mapEducation(
      fallback.education.map((e) => ({ ...e, id: e.id })),
      locale,
    ),
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
  projects?: SanityProject[];
  experience?: SanityExperience[];
  education?: SanityEducation[];
  certificates?: (SanityCertificate & { legacyName?: string })[];
  skills?: SanitySkill[];
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
  const education = mapEducation(
    (data.education ?? []).map((e) => ({ ...e, id: e._id })),
    locale,
  );
  const skillCategories = sanitySkillCategories(data.skills ?? [], locale);
  const settings = data.siteSettings ?? null;

  return {
    projects: projects.length ? projects : fb.projects,
    experience: experience.length ? experience : fb.experience,
    education: education.length ? education : fb.education,
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
      (data.education?.length ?? 0) > 0 ||
      (data.certificates?.length ?? 0) > 0 ||
      (data.skills?.length ?? 0) > 0 ||
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
