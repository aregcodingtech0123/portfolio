import { defineField, defineType } from "sanity";

export const skillTierGroup = defineType({
  name: "skillTierGroup",
  title: "Skill tier group",
  type: "object",
  fields: [
    defineField({
      name: "tier",
      title: "Proficiency tier",
      type: "string",
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
      name: "skills",
      title: "Skills",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { tier: "tier", skills: "skills" },
    prepare({ tier, skills }) {
      const count = Array.isArray(skills) ? skills.length : 0;
      return {
        title: tier ? String(tier) : "Tier",
        subtitle: `${count} skill${count === 1 ? "" : "s"}`,
      };
    },
  },
});
