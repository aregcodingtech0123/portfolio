import { defineField, defineType } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";

export const localeText = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  icon: EarthGlobeIcon,
  fields: [
    defineField({
      name: "en",
      title: "English",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().max(4000),
    }),
    defineField({
      name: "tr",
      title: "Turkish",
      type: "text",
      rows: 4,
      validation: (rule) => rule.max(4000),
    }),
  ],
  preview: {
    select: { title: "en", subtitle: "tr" },
    prepare({ title, subtitle }) {
      return {
        title: title ? title.slice(0, 80) : "Empty",
        subtitle: subtitle ? `TR: ${subtitle.slice(0, 60)}` : "No Turkish translation",
      };
    },
  },
});
