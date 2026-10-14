import { defineField, defineType } from "sanity";
import { CaseIcon } from "@sanity/icons";

const groups = [
  { name: "role", title: "Role", default: true },
  { name: "details", title: "Details" },
  { name: "meta", title: "Ordering" },
];

export const experience = defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  icon: CaseIcon,
  groups,
  fields: [
    defineField({
      name: "company",
      title: "Company",
      type: "localeString",
      group: "role",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "localeString",
      group: "role",
      description:
        "City and country, or Remote. Shown next to the company or institution.",
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "localeString",
      group: "role",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "period",
      title: "Period",
      type: "localeString",
      group: "role",
      description: 'e.g. "2024 - Present" / "2024 - Günümüz"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localeText",
      group: "details",
      description:
        "Localized role summary shown under the job title. Prefer one or two sentences.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "detail",
      title: "Detail (legacy)",
      type: "localeText",
      group: "details",
      hidden: true,
      description: "Deprecated. Use Description. Kept so older documents still resolve.",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      group: "meta",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
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
      company: "company.en",
      role: "role.en",
      period: "period.en",
      location: "location.en",
    },
    prepare({ company, role, period, location }) {
      return {
        title: company || "Company",
        subtitle: [role, location, period].filter(Boolean).join(" · "),
        media: CaseIcon,
      };
    },
  },
});
