import { defineArrayMember, defineField, defineType } from "sanity";
import { RocketIcon } from "@sanity/icons";

const groups = [
  { name: "content", title: "Content", default: true },
  { name: "media", title: "Media" },
  { name: "links", title: "Links" },
  { name: "meta", title: "Meta & ordering" },
];

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: RocketIcon,
  groups,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "code",
      title: "Project code",
      type: "string",
      group: "content",
      description: "Short internal code shown as a label, e.g. PRJ-001.",
      validation: (rule) =>
        rule.required().regex(/^PRJ-\d{3}$/, "PRJ-001 format"),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Live", value: "live" },
          { title: "Work in progress", value: "wip" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "title.en", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localeText",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "problem",
      title: "Problem",
      type: "localeText",
      group: "content",
      description: "What problem did this project try to solve? First person, two sentences max. Leave as [TODO] until you write it.",
    }),
    defineField({
      name: "approach",
      title: "Approach",
      type: "localeText",
      group: "content",
      description: "How did you build it? First person, two sentences max. Leave as [TODO] until you write it.",
    }),
    defineField({
      name: "challenge",
      title: "Hardest challenge",
      type: "localeText",
      group: "content",
      description: "What was the hardest part, and what did you do about it? Two sentences max. Leave as [TODO] until you write it.",
    }),
    defineField({
      name: "learned",
      title: "What I learned",
      type: "localeText",
      group: "content",
      description: "What would you do differently or carry into the next project? Two sentences max. Leave as [TODO] until you write it.",
    }),
    defineField({
      name: "image",
      title: "Cover image",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.max(200),
        }),
      ],
    }),
    defineField({
      name: "githubUrl",
      title: "GitHub URL",
      type: "url",
      group: "links",
      validation: (rule) =>
        rule.uri({ scheme: ["https"], allowRelative: false }),
    }),
    defineField({
      name: "liveUrl",
      title: "Live demo URL",
      type: "url",
      group: "links",
      validation: (rule) =>
        rule.uri({ scheme: ["https"], allowRelative: false }),
    }),
    defineField({
      name: "technologies",
      title: "Technologies",
      type: "array",
      group: "meta",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "AI", value: "ai" },
          { title: "Full Stack", value: "fullstack" },
          { title: "Security", value: "security" },
          { title: "Tooling", value: "tooling" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      group: "meta",
      description: "Lower numbers appear first.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "meta",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title.en",
      code: "code",
      status: "status",
      media: "image",
    },
    prepare({ title, code, status, media }) {
      return {
        title: title || "Untitled project",
        subtitle: [code, status, "case study"].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
