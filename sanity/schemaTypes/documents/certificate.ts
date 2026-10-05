import { defineField, defineType } from "sanity";
import { DocumentIcon } from "@sanity/icons";

const groups = [
  { name: "content", title: "Certificate", default: true },
  { name: "meta", title: "Category & order" },
];

export const certificate = defineType({
  name: "certificate",
  title: "Certificate",
  type: "document",
  icon: DocumentIcon,
  groups,
  fields: [
    defineField({
      name: "title",
      title: "Certificate name",
      type: "localeString",
      group: "content",
      description: "Use the official title. Turkish: use the official Turkish title if one exists, otherwise the English title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "issuer",
      title: "Issuer",
      type: "localeString",
      group: "content",
      description: "Organization that issued the certificate.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "string",
      group: "content",
      description: 'Optional. e.g. "March 2026" or "2024"',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "Education & Specialization", value: "education" },
          { title: "Participation & Events", value: "participation" },
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
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "credentialUrl",
      title: "Verification URL",
      type: "url",
      group: "content",
      validation: (rule) =>
        rule.uri({ scheme: ["https"], allowRelative: false }),
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
      issuer: "issuer.en",
      date: "date",
      category: "category",
    },
    prepare({ title, issuer, date, category }) {
      const categoryLabel =
        category === "education"
          ? "Education"
          : category === "participation"
            ? "Participation"
            : "Certificate";
      return {
        title: title || "Untitled certificate",
        subtitle: [issuer, date, categoryLabel].filter(Boolean).join(" · "),
        media: DocumentIcon,
      };
    },
  },
});
