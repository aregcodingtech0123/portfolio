import type { StructureResolver } from "sanity/structure";
import {
  CogIcon,
  DocumentIcon,
  CaseIcon,
  RocketIcon,
  SparklesIcon,
  LockIcon,
  BlockContentIcon,
} from "@sanity/icons";
import { apiVersion } from "./env";

/** Fixed skill categories shown as Studio folders (matches skill.category options). */
const SKILL_CATEGORIES = [
  { id: "ai", title: "AI & Machine Learning", categoryOrder: 0 },
  { id: "frontend", title: "Frontend Development", categoryOrder: 1 },
  { id: "backend", title: "Backend Development", categoryOrder: 2 },
  { id: "security", title: "Cybersecurity", categoryOrder: 3 },
  { id: "languages", title: "Languages & Tools", categoryOrder: 4 },
] as const;

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Portfolio CMS")
    .items([
      S.listItem()
        .title("Site settings")
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Site settings"),
        ),
      S.divider(),
      S.documentTypeListItem("project").title("Projects").icon(RocketIcon),
      S.documentTypeListItem("experience")
        .title("Experience")
        .icon(CaseIcon),
      S.documentTypeListItem("education")
        .title("Education")
        .icon(BlockContentIcon),
      S.documentTypeListItem("certificate")
        .title("Certificates")
        .icon(DocumentIcon),
      S.listItem()
        .title("Skills")
        .icon(SparklesIcon)
        .child(
          S.list()
            .title("Skills by category")
            .items(
              SKILL_CATEGORIES.map((cat) =>
                S.listItem()
                  .id(`skill-category-${cat.id}`)
                  .title(cat.title)
                  .icon(SparklesIcon)
                  .child(
                    S.documentList()
                      .apiVersion(apiVersion)
                      .title(cat.title)
                      .schemaType("skill")
                      .filter(
                        '_type == "skill" && coalesce(category, categoryId) == $category',
                      )
                      .params({ category: cat.id })
                      .defaultOrdering([
                        { field: "order", direction: "asc" },
                        { field: "name", direction: "asc" },
                      ])
                      .initialValueTemplates([
                        S.initialValueTemplateItem("skill-by-category", {
                          category: cat.id,
                          categoryOrder: cat.categoryOrder,
                        }),
                      ]),
                  ),
              ),
            ),
        ),
      S.documentTypeListItem("ctf")
        .title("CTF challenges")
        .icon(LockIcon),
    ]);
