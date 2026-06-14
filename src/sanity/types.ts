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

export type SanityProject = {
  _id: string;
  slug: string;
  title: LocaleField;
  description: LocaleField;
  technologies: string[];
  category: "ai" | "fullstack" | "security" | "tooling";
  githubUrl?: string;
  liveUrl?: string;
  image?: SanityImageAsset;
  order: number;
};

export type SanityExperience = {
  _id: string;
  company: LocaleField;
  role: LocaleField;
  period: LocaleField;
  detail: LocaleField;
  order: number;
};

export type SanityCertificate = {
  _id: string;
  name: string;
  issuer: string;
  date?: string;
  category: "education" | "participation";
  order: number;
  credentialUrl?: string;
};

export type SanitySkillCategory = {
  _id: string;
  categoryId: "ai" | "frontend" | "backend" | "security" | "languages";
  label: LocaleField;
  groups: {
    tier: "expertise" | "comfortable" | "learning";
    skills: string[];
  }[];
  order: number;
};

export type CtfDifficulty = "easy" | "medium" | "hard" | "insane";

export type SanityCtf = {
  _id: string;
  title: string;
  slug: string;
  platform: string;
  difficulty: CtfDifficulty;
  dateSolved: string;
  tools: string[];
  writeup?: unknown[];
  coverImage?: SanityImageAsset;
};

export type CtfDisplay = {
  id: string;
  slug: string;
  title: string;
  platform: string;
  difficulty: CtfDifficulty;
  dateSolved: string;
  tools: string[];
  imageUrl?: string;
  imageAlt?: string;
  hasWriteup: boolean;
};

export type SanitySiteSettings = {
  siteName: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  location: LocaleField;
  hero?: {
    greeting?: LocaleField;
    name?: LocaleField;
    rolePrefix?: LocaleField;
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

export type HeroDisplay = {
  greeting: string;
  name: string;
  rolePrefix: string;
  ctaProjects: string;
  ctaContact: string;
  badges: { ai: string; fullstack: string; security: string };
  typingRoles: string[];
  profileTagline: string;
};

export type AboutDisplay = {
  summary: string;
  location: string;
  edu1: string;
  edu2: string;
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

export type ContactInfoDisplay = {
  email: string;
  location: string;
};

export type SocialLinksDisplay = {
  github: string;
  linkedin: string;
};

export function pickLocale(
  field: LocaleField | undefined,
  locale: string,
): string {
  if (!field) return "";
  const primary = locale === "tr" ? field.tr : field.en;
  return primary || field.en || field.tr || "";
}

export function pickLocaleList(
  fields: LocaleField[] | undefined,
  locale: string,
): string[] {
  if (!fields?.length) return [];
  return fields
    .map((field) => pickLocale(field, locale))
    .filter(Boolean);
}
