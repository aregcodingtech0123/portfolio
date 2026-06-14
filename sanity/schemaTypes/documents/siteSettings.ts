import { defineArrayMember, defineField, defineType } from "sanity";
import { CogIcon, EarthGlobeIcon } from "@sanity/icons";

const groups = [
  { name: "profile", title: "Profile", default: true },
  { name: "hero", title: "Hero" },
  { name: "about", title: "About" },
  { name: "social", title: "Social links" },
  { name: "contact", title: "Contact" },
  { name: "seo", title: "SEO" },
];

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  groups,
  fields: [
    defineField({
      name: "siteName",
      title: "Site / owner name",
      type: "string",
      group: "profile",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "hero",
      title: "Hero section",
      type: "object",
      group: "hero",
      fields: [
        defineField({ name: "greeting", type: "localeString", title: "Greeting" }),
        defineField({ name: "name", type: "localeString", title: "Name" }),
        defineField({ name: "rolePrefix", type: "localeString", title: "Role prefix" }),
        defineField({ name: "ctaProjects", type: "localeString", title: "Projects CTA" }),
        defineField({ name: "ctaContact", type: "localeString", title: "Contact CTA" }),
        defineField({
          name: "badges",
          title: "Badges",
          type: "object",
          fields: [
            defineField({ name: "ai", type: "localeString", title: "AI badge" }),
            defineField({ name: "fullstack", type: "localeString", title: "Full stack badge" }),
            defineField({ name: "security", type: "localeString", title: "Security badge" }),
          ],
        }),
        defineField({
          name: "typingRoles",
          title: "Typing roles",
          type: "array",
          of: [defineArrayMember({ type: "localeString" })],
          validation: (rule) => rule.min(1).max(6),
        }),
        defineField({ name: "profileTagline", type: "localeString", title: "Profile tagline" }),
      ],
    }),
    defineField({
      name: "about",
      title: "About section",
      type: "object",
      group: "about",
      fields: [
        defineField({ name: "summary", type: "localeText", title: "Summary" }),
        defineField({ name: "edu1", type: "localeString", title: "Education line 1" }),
        defineField({ name: "edu2", type: "localeString", title: "Education line 2" }),
        defineField({ name: "experienced", type: "localeString", title: "Highlights heading" }),
        defineField({
          name: "stats",
          title: "Stats cards",
          type: "object",
          fields: [
            defineField({ name: "focus", type: "localeString", title: "Focus label" }),
            defineField({ name: "focusValue", type: "localeString", title: "Focus value" }),
            defineField({ name: "stack", type: "localeString", title: "Stack label" }),
            defineField({ name: "stackValue", type: "localeString", title: "Stack value" }),
            defineField({ name: "mindset", type: "localeString", title: "Mindset label" }),
            defineField({ name: "mindsetValue", type: "localeString", title: "Mindset value" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "aboutHighlights",
      title: "About highlight chips",
      type: "array",
      group: "about",
      of: [
        defineArrayMember({
          type: "object",
          name: "highlight",
          fields: [
            defineField({
              name: "text",
              title: "Text",
              type: "localeString",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "text.en", subtitle: "text.tr" },
          },
        }),
      ],
    }),
    defineField({
      name: "githubUrl",
      title: "GitHub URL",
      type: "url",
      group: "social",
      validation: (rule) =>
        rule.required().uri({ scheme: ["https"], allowRelative: false }),
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn URL",
      type: "url",
      group: "social",
      validation: (rule) =>
        rule.required().uri({ scheme: ["https"], allowRelative: false }),
    }),
    defineField({
      name: "email",
      title: "Public email",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "localeString",
      group: "contact",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      group: "seo",
      fields: [
        defineField({
          name: "homeDescription",
          type: "localeText",
          title: "Home meta description",
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "siteName" },
    prepare({ title }) {
      return {
        title: title || "Site settings",
        subtitle: "Global profile, hero, about & links",
        media: EarthGlobeIcon,
      };
    },
  },
});
