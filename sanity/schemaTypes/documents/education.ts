import { defineField, defineType } from "sanity";
import { BlockContentIcon } from "@sanity/icons";

const groups = [
  { name: "program", title: "Program", default: true },
  { name: "dates", title: "Dates" },
  { name: "details", title: "Details" },
  { name: "meta", title: "Ordering" },
];

export const education = defineType({
  name: "education",
  title: "Education",
  type: "document",
  icon: BlockContentIcon,
  groups,
  fields: [
    defineField({
      name: "institution",
      title: "Institution",
      type: "localeString",
      group: "program",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "degree",
      title: "Degree",
      type: "localeString",
      group: "program",
      description: 'e.g. "B.Sc." / "Lisans"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fieldOfStudy",
      title: "Field of study",
      type: "localeString",
      group: "program",
      description: 'e.g. "Computer Engineering" / "Bilgisayar Mühendisliği"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "string",
      group: "dates",
      description: 'Year or YYYY-MM, e.g. "2021" or "2021-09".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "string",
      group: "dates",
      description: "Leave blank when still studying and mark Current below.",
    }),
    defineField({
      name: "isCurrent",
      title: "Current",
      type: "boolean",
      group: "dates",
      description: "Still enrolled / in progress.",
      initialValue: false,
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "localeText",
      group: "details",
      description:
        "Optional highlights: honors, medium of instruction, focus areas. Two sentences max.",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      group: "meta",
      description: "Lower numbers appear first when dates are equal.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: "End date (newest)",
      name: "endDateDesc",
      by: [{ field: "endDate", direction: "desc" }],
    },
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      institution: "institution.en",
      degree: "degree.en",
      field: "fieldOfStudy.en",
      startDate: "startDate",
      endDate: "endDate",
      isCurrent: "isCurrent",
    },
    prepare({ institution, degree, field, startDate, endDate, isCurrent }) {
      const period = isCurrent
        ? `${startDate || "?"} – Present`
        : [startDate, endDate].filter(Boolean).join(" – ");
      return {
        title: institution || "Institution",
        subtitle: [[degree, field].filter(Boolean).join(" · "), period]
          .filter(Boolean)
          .join(" · "),
        media: BlockContentIcon,
      };
    },
  },
});
