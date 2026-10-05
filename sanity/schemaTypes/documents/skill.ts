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
      name: "categoryId",
      title: "Category",
      type: "string",
      group: "content",
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
      validation: (rule) => rule.required(),
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
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      group: "content",
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
    select: { title: "name", categoryId: "categoryId", tier: "tier", level: "level" },
    prepare({ title, categoryId, tier, level }) {
      return {
        title: title || "Untitled skill",
        subtitle: [categoryId, tier, level ?? "level not set"]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
});
