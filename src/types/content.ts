export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  /** Localized description shown under the role / company / dates. */
  description: string;
  /** City and country, or Remote. Omitted when unset or blank. */
  location?: string;
};

export type EducationItem = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  period: string;
  /** City and country, or Remote. Omitted when unset or blank. */
  location?: string;
  /** Set only when the content marks the program as ongoing. */
  isCurrent?: boolean;
};
