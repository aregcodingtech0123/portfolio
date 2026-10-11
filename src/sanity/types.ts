/**
 * Types for Sanity documents and the display shapes built from them.
 * Keep these in sync with sanity/schemaTypes and src/sanity/queries.ts.
 */

export type LocaleField = {
  en?: string;
  tr?: string;
};

export type SanityImageAsset = {
  _type?: string;
  asset?: {
    _ref?: string;
    _type?: string;
  };
  alt?: string;
};

export type ProjectCategory = "ai" | "fullstack" | "security" | "tooling";
export type ProjectStatus = "live" | "wip" | "archived";

export type SkillCategoryId =
  | "ai"
  | "frontend"
  | "backend"
  | "security"
  | "languages"
  | (string & {});
export type SkillTierId = "expertise" | "comfortable" | "learning";
export type SkillLevel = "daily" | "used-in-project" | "learning";

export type CtfDifficulty = "easy" | "medium" | "hard" | "insane";

export type SanityProject = {
  _id: string;
  slug: string;
  code?: string;
  status?: ProjectStatus;
  title: LocaleField;
  description: LocaleField;
  problem?: LocaleField;
  approach?: LocaleField;
  challenge?: LocaleField;
  learned?: LocaleField;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  image?: SanityImageAsset;
  order: number;
  featured?: boolean;
};

export type SanityExperience = {
  _id: string;
  company: LocaleField;
  role: LocaleField;
  period: LocaleField;
  /** Localized role summary. GROQ may coalesce legacy `detail` into this. */
  description?: LocaleField;
  /** @deprecated Prefer `description`. */
  detail?: LocaleField;
  order: number;
};

export type SanityEducation = {
  _id: string;
  institution: LocaleField;
  degree: LocaleField;
  fieldOfStudy: LocaleField;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: LocaleField;
  order: number;
};

export type SanityCertificate = {
  _id: string;
  title?: LocaleField | string;
  /** Legacy field from before `title` became bilingual. */
  name?: string;
  issuer?: LocaleField | string;
  date?: string;
  category: "education" | "participation";
  order: number;
  credentialUrl?: string;
};

export type SanitySkill = {
  _id: string;
  name: string;
  /** Category key (e.g. ai, frontend) or a custom string. */
  category: SkillCategoryId;
  categoryOrder?: number;
  order: number;
  featured?: boolean;
  tier?: SkillTierId;
  level?: SkillLevel;
  evidence?: {
    _type: "project" | "ctf";
    slug?: string;
    title?: LocaleField | string;
  } | null;
};

export type SanityCtf = {
  _id: string;
  title: string;
  slug: string;
  platform: string;
  difficulty: CtfDifficulty;
  dateSolved: string;
  eventName?: string;
  category?: string;
  placement?: string;
  writeupUrl?: string;
  tools: string[];
  writeup?: unknown[];
  coverImage?: SanityImageAsset;
};

export type SanitySiteSettings = {
  siteName: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  location: LocaleField;
  hero?: {
    greeting?: LocaleField;
    eyebrow?: LocaleField;
    name?: LocaleField;
    rolePrefix?: LocaleField;
    headline?: LocaleField;
    subline?: LocaleField;
    ctaProjects?: LocaleField;
    ctaContact?: LocaleField;
    badges?: {
      ai?: LocaleField;
      fullstack?: LocaleField;
      security?: LocaleField;
    };
    typingRoles?: LocaleField[];
    profileTagline?: LocaleField;
  };
  about?: {
    summary?: LocaleField;
    paragraphs?: LocaleField[];
    edu1?: LocaleField;
    edu2?: LocaleField;
    experienced?: LocaleField;
    stats?: {
      focus?: LocaleField;
      focusValue?: LocaleField;
      stack?: LocaleField;
      stackValue?: LocaleField;
      mindset?: LocaleField;
      mindsetValue?: LocaleField;
    };
  };
  aboutHighlights?: { text: LocaleField }[];
  seo?: {
    homeDescription?: LocaleField;
  };
};

/* ---------- display shapes used by components ---------- */

export type ProjectDisplay = {
  id: string;
  code?: string;
  status?: ProjectStatus;
  title: string;
  description: string;
  problem?: string;
  approach?: string;
  challenge?: string;
  learned?: string;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  featured: boolean;
};

export type CertificateDisplay = {
  title: string;
  issuer: string;
  date?: string;
};

export type SkillDisplay = {
  name: string;
  featured?: boolean;
  /** Proficiency tier from Sanity (`tier` / `proficiencyTier`). */
  tier?: SkillTierId;
  level?: SkillLevel;
  evidenceTitle?: string;
  /** In-page anchor of the evidence section, e.g. "#projects". */
  evidenceHref?: string;
};

export type SkillCategoryDisplay = {
  id: string;
  label: string;
  skills: SkillDisplay[];
};

export type CtfDisplay = {
  id: string;
  slug: string;
  title: string;
  platform: string;
  difficulty: CtfDifficulty;
  dateSolved: string;
  eventName?: string;
  category?: string;
  placement?: string;
  writeupUrl?: string;
  tools: string[];
  imageUrl?: string;
  imageAlt?: string;
  hasWriteup: boolean;
};

export type HeroDisplay = {
  greeting: string;
  eyebrow: string;
  name: string;
  rolePrefix: string;
  headline: string;
  subline: string;
  ctaProjects: string;
  ctaContact: string;
  badges: { ai: string; fullstack: string; security: string };
  typingRoles: string[];
  profileTagline: string;
};

export type AboutDisplay = {
  summary: string;
  paragraphs: string[];
  location: string;
  experienced: string;
  highlights: string[];
  stats: {
    focus: string;
    focusValue: string;
    stack: string;
    stackValue: string;
    mindset: string;
    mindsetValue: string;
  };
};

export type EducationDisplay = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  period: string;
};

export type ContactInfoDisplay = {
  /** Empty string means no public email is configured; the UI hides it. */
  email: string;
  location: string;
};

export type SocialLinksDisplay = {
  github: string;
  linkedin: string;
};

/** Resolves a bilingual field for the locale, falling back to English. Plain strings are treated as English. */
export function pickLocale(
  field: LocaleField | string | undefined | null,
  locale: string,
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  const primary = locale === "tr" ? field.tr : field.en;
  return primary || field.en || field.tr || "";
}

export function pickLocaleList(
  fields: (LocaleField | string)[] | undefined,
  locale: string,
): string[] {
  if (!fields?.length) return [];
  return fields.map((field) => pickLocale(field, locale)).filter(Boolean);
}
