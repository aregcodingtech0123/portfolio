import { groq } from "next-sanity";

const projectFields = groq`
  _id,
  "slug": slug.current,
  code,
  status,
  title,
  description,
  problem,
  approach,
  challenge,
  learned,
  technologies,
  category,
  githubUrl,
  liveUrl,
  order,
  featured,
  image {
    ...,
    asset->
  }
`;

const ctfFields = groq`
  _id,
  title,
  "slug": slug.current,
  platform,
  difficulty,
  dateSolved,
  eventName,
  category,
  placement,
  writeupUrl,
  tools,
  writeup,
  coverImage {
    ...,
    asset->
  }
`;

const skillFields = groq`
  _id,
  name,
  "category": coalesce(category, categoryId),
  categoryOrder,
  order,
  featured,
  "tier": coalesce(proficiencyTier, tier),
  level,
  "evidence": evidence->{
    _type,
    title,
    "slug": slug.current
  }
`;

/**
 * Everything the home page needs, in one request.
 * `legacyName` keeps certificates that predate the bilingual `title` field readable.
 */
export const portfolioContentQuery = groq`{
  "projects": *[_type == "project"] | order(order asc, title.en asc) {
    ${projectFields}
  },
  "experience": *[_type == "experience"] | order(order asc, company.en asc) {
    _id,
    company,
    role,
    period,
    "description": coalesce(description, detail),
    order
  },
  "education": *[_type == "education"] | order(
    coalesce(endDate, startDate) desc,
    order asc,
    institution.en asc
  ) {
    _id,
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    isCurrent,
    order
  },
  "certificates": *[_type == "certificate"] | order(order asc, title.en asc) {
    _id,
    title,
    "legacyName": name,
    issuer,
    date,
    category,
    order,
    credentialUrl
  },
  "skills": *[_type == "skill"] | order(categoryOrder asc, order asc, name asc) {
    ${skillFields}
  },
  "siteSettings": *[_type == "siteSettings" && _id == "siteSettings"][0] {
    siteName,
    githubUrl,
    linkedinUrl,
    email,
    location,
    hero,
    about,
    aboutHighlights,
    seo
  },
  "ctfs": *[_type == "ctf" && published != false] | order(dateSolved desc) {
    ${ctfFields}
  }
}`;
