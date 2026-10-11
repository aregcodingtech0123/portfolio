export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  /** Localized description shown under the role / company / dates. */
  description: string;
};

export type EducationItem = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  period: string;
};
