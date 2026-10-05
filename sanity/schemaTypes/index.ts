import { project } from "./documents/project";
import { experience } from "./documents/experience";
import { certificate } from "./documents/certificate";
import { skillCategory } from "./documents/skillCategory";
import { siteSettings } from "./documents/siteSettings";
import { ctf } from "./documents/ctf";
import { skill } from "./documents/skill";
import { localeString } from "./objects/localeString";
import { localeText } from "./objects/localeText";
import { skillTierGroup } from "./objects/skillTierGroup";

export const schemaTypes = [
  localeString,
  localeText,
  skillTierGroup,
  siteSettings,
  project,
  experience,
  certificate,
  skillCategory,
  skill,
  ctf,
];
