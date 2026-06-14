import { defineField, defineType } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";

export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  icon: EarthGlobeIcon,
  fields: [
    defineField({
      name: "en",
      title: "English",
      type: "string",
      validation: (rule) => rule.required().max(500),
    }),
    defineField({
      name: "tr",
      title: "Turkish",
      type: "string",
      validation: (rule) => rule.max(500),
    }),
  ],
  preview: {
    select: { title: "en", subtitle: "tr" },
    prepare({ title, subtitle }) {
      return {
        title: title || "Untitled",
        subtitle: subtitle ? `TR: ${subtitle}` : "No Turkish translation",
      };
    },
  },
});
