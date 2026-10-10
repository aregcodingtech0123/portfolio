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
  categoryId,
  tier,
  level,
  order,
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
    detail,
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
  "skills": *[_type == "skill"] | order(order asc, name asc) {
    ${skillFields}
  },
  "skillCategories": *[_type == "skillCategory"] | order(order asc, categoryId asc) {
    _id,
    categoryId,
    label,
    groups,
    order
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
