import { defineField, defineType } from "sanity";
import { SparklesIcon } from "@sanity/icons";

export const skill = defineType({
  name: "skill",
  title: "Skill",
  type: "document",
  icon: SparklesIcon,
  groups: [
    { name: "content", title: "Skill", default: true },
    { name: "evidence", title: "Evidence" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Skill name",
      type: "string",
      group: "content",
      description: "Product or technique name, e.g. LangChain. Not translated.",
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "content",
      description:
        "Grouping key for the Skills section. Prefer a listed value; custom strings are allowed.",
      options: {
        list: [
          { title: "AI & Machine Learning", value: "ai" },
          { title: "Frontend Development", value: "frontend" },
          { title: "Backend Development", value: "backend" },
          { title: "Cybersecurity", value: "security" },
          { title: "Languages & Tools", value: "languages" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "categoryOrder",
      title: "Category order",
      type: "number",
      group: "content",
      description:
        "Sort order for the category column. Use the same value for every skill in a category.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "order",
      title: "Skill order",
      type: "number",
      group: "content",
      description: "Sort order within the category.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "content",
      description: "Highlight this skill within its category.",
      initialValue: false,
    }),
    defineField({
      name: "tier",
      title: "Proficiency tier",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Expertise", value: "expertise" },
          { title: "Comfortable", value: "comfortable" },
          { title: "Learning", value: "learning" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "level",
      title: "Level of use",
      type: "string",
      group: "content",
      description:
        "How you have used it. Leave empty if you are not sure. Do not guess.",
      options: {
        list: [
          { title: "Daily use", value: "daily" },
          { title: "Used in a project", value: "used-in-project" },
          { title: "Learning", value: "learning" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "evidence",
      title: "Evidence",
      type: "reference",
      group: "evidence",
      description:
        "Project or CTF where you actually used this skill. Leave empty if there is none yet.",
      to: [{ type: "project" }, { type: "ctf" }],
      options: { disableNew: true },
    }),
  ],
  orderings: [
    {
      title: "Category then skill order",
      name: "categoryThenOrder",
      by: [
        { field: "categoryOrder", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
    {
      title: "Skill order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      category: "category",
      featured: "featured",
      tier: "tier",
      level: "level",
    },
    prepare({ title, category, featured, tier, level }) {
      return {
        title: title || "Untitled skill",
        subtitle: [
          category,
          tier,
          featured ? "featured" : null,
          level ?? null,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
});
