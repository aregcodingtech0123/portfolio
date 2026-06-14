import { defineArrayMember, defineField, defineType } from "sanity";
import { LockIcon } from "@sanity/icons";

const groups = [
  { name: "overview", title: "Overview", default: true },
  { name: "media", title: "Media" },
  { name: "writeup", title: "Write-up" },
  { name: "meta", title: "Meta" },
];

export const ctf = defineType({
  name: "ctf",
  title: "CTF Challenge",
  type: "document",
  icon: LockIcon,
  groups,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "overview",
      description: "Machine or challenge name (e.g. Lame, Blue, Pickle Rick).",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "overview",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      group: "overview",
      options: {
        list: [
          { title: "Hack The Box", value: "HackTheBox" },
          { title: "TryHackMe", value: "TryHackMe" },
          { title: "PicoCTF", value: "PicoCTF" },
          { title: "OverTheWire", value: "OverTheWire" },
          { title: "Root Me", value: "RootMe" },
          { title: "Custom / Self-hosted", value: "Custom" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      group: "overview",
      options: {
        list: [
          { title: "Easy", value: "easy" },
          { title: "Medium", value: "medium" },
          { title: "Hard", value: "hard" },
          { title: "Insane", value: "insane" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dateSolved",
      title: "Date solved",
      type: "date",
      group: "overview",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.max(200),
        }),
      ],
    }),
    defineField({
      name: "tools",
      title: "Tools & tech used",
      type: "array",
      group: "overview",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "writeup",
      title: "Description / Write-up",
      type: "array",
      group: "writeup",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  defineField({
                    name: "href",
                    type: "url",
                    validation: (rule) =>
                      rule.uri({ allowRelative: true, scheme: ["http", "https"] }),
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "published",
      title: "Published on site",
      type: "boolean",
      group: "meta",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Date solved (newest)",
      name: "dateSolvedDesc",
      by: [{ field: "dateSolved", direction: "desc" }],
    },
    {
      title: "Difficulty",
      name: "difficultyAsc",
      by: [{ field: "difficulty", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      platform: "platform",
      difficulty: "difficulty",
      dateSolved: "dateSolved",
      media: "coverImage",
    },
    prepare({ title, platform, difficulty, dateSolved, media }) {
      const dateLabel = dateSolved
        ? new Date(dateSolved).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "No date";
      return {
        title: title || "Untitled CTF",
        subtitle: [platform, difficulty, dateLabel].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
