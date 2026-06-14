import { groq } from "next-sanity";

export const portfolioContentQuery = groq`{
  "projects": *[_type == "project" && featured != false] | order(order asc, title.en asc) {
    _id,
    "slug": slug.current,
    title,
    description,
    technologies,
    category,
    githubUrl,
    liveUrl,
    order,
    image {
      ...,
      asset->
    }
  },
  "experience": *[_type == "experience"] | order(order asc, company.en asc) {
    _id,
    company,
    role,
    period,
    detail,
    order
  },
  "certificates": *[_type == "certificate"] | order(order asc, name asc) {
    _id,
    name,
    issuer,
    date,
    category,
    order,
    credentialUrl
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
    _id,
    title,
    "slug": slug.current,
    platform,
    difficulty,
    dateSolved,
    tools,
    writeup,
    coverImage {
      ...,
      asset->
    }
  }
}`;

export const projectsQuery = groq`
  *[_type == "project" && featured != false] | order(order asc, title.en asc) {
    _id,
    "slug": slug.current,
    title,
    description,
    technologies,
    category,
    githubUrl,
    liveUrl,
    order,
    image {
      ...,
      asset->
    }
  }
`;

export const experienceQuery = groq`
  *[_type == "experience"] | order(order asc, company.en asc) {
    _id,
    company,
    role,
    period,
    detail,
    order
  }
`;

export const certificatesQuery = groq`
  *[_type == "certificate"] | order(order asc, name asc) {
    _id,
    name,
    issuer,
    date,
    category,
    order,
    credentialUrl
  }
`;

export const skillCategoriesQuery = groq`
  *[_type == "skillCategory"] | order(order asc, categoryId asc) {
    _id,
    categoryId,
    label,
    groups,
    order
  }
`;

export const siteSettingsQuery = groq`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    siteName,
    githubUrl,
    linkedinUrl,
    email,
    location,
    hero,
    about,
    aboutHighlights,
    seo
  }
`;

export const ctfsQuery = groq`
  *[_type == "ctf" && published != false] | order(dateSolved desc) {
    _id,
    title,
    "slug": slug.current,
    platform,
    difficulty,
    dateSolved,
    tools,
    writeup,
    coverImage {
      ...,
      asset->
    }
  }
`;
