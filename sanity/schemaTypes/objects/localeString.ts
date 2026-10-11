import { defineField, defineType } from "sanity";
import { EarthGlobeIcon } from "@sanity/icons";
import { LocaleTranslateInput } from "../../components/LocaleTranslateInput";

export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  icon: EarthGlobeIcon,
  components: {
    input: LocaleTranslateInput,
  },
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
