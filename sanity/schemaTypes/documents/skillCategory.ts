import { defineArrayMember, defineField, defineType } from "sanity";
import { SparklesIcon } from "@sanity/icons";

export const skillCategory = defineType({
  name: "skillCategory",
  title: "Skill category",
  type: "document",
  icon: SparklesIcon,
  fields: [
    defineField({
      name: "categoryId",
      title: "Category ID",
      type: "string",
      description: "Must match frontend icon mapping (ai, frontend, backend, security, languages).",
      options: {
        list: [
          { title: "AI", value: "ai" },
          { title: "Frontend", value: "frontend" },
          { title: "Backend", value: "backend" },
          { title: "Security", value: "security" },
          { title: "Languages & Tools", value: "languages" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      title: "Display label",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "groups",
      title: "Skill tiers",
      type: "array",
      of: [defineArrayMember({ type: "skillTierGroup" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
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
      title: "label.en",
      categoryId: "categoryId",
      order: "order",
    },
    prepare({ title, categoryId, order }) {
      return {
        title: title || categoryId || "Skill category",
        subtitle: `#${order ?? "—"} · ${categoryId ?? "unknown"}`,
        media: SparklesIcon,
      };
    },
  },
});
