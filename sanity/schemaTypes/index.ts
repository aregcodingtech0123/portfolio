import { project } from "./documents/project";
import { experience } from "./documents/experience";
import { education } from "./documents/education";
import { certificate } from "./documents/certificate";
import { siteSettings } from "./documents/siteSettings";
import { ctf } from "./documents/ctf";
import { skill } from "./documents/skill";
import { localeString } from "./objects/localeString";
import { localeText } from "./objects/localeText";

export const schemaTypes = [
  localeString,
  localeText,
  siteSettings,
  project,
  experience,
  education,
  certificate,
  skill,
  ctf,
];
