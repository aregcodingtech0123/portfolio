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

/**
 * Certificate folders. Stored `category` values match the schema options.
 * Anything else, including a missing category, stays visible under "Diğer".
 * No extra sort: each list is a document-type list, so it keeps that list's
 * default ordering (last edited) and the schema's sort menu.
 */
const CERTIFICATE_GROUPS = [
  {
    id: "certificate-education",
    title: "Eğitim sertifikaları",
    filter: '_type == $type && category == "education"',
    templateId: "certificate-education",
  },
  {
    id: "certificate-participation",
    title: "Etkinlik katılımları",
    filter: '_type == $type && category == "participation"',
    templateId: "certificate-participation",
  },
  {
    id: "certificate-other",
    title: "Diğer / kategorisiz",
    filter: '_type == $type && !(category in ["education", "participation"])',
    templateId: null,
  },
] as const;

/** Fixed skill categories shown as Studio folders (matches skill.category options). */
const SKILL_CATEGORIES = [
  { id: "ai", title: "AI & Machine Learning", categoryOrder: 0 },
  { id: "frontend", title: "Frontend Development", categoryOrder: 1 },
  { id: "backend", title: "Backend Development", categoryOrder: 2 },
  { id: "security", title: "Cybersecurity", categoryOrder: 3 },
  { id: "languages", title: "Languages & Tools", categoryOrder: 4 },
  { id: "programming-languages", title: "Programming Languages", categoryOrder: 5 },
  { id: "databases", title: "Databases", categoryOrder: 6 },
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
      S.listItem()
        .id("certificate")
        .title("Certificates")
        .icon(DocumentIcon)
        .child(
          S.list()
            .id("certificate-groups")
            .title("Certificates")
            .items(
              CERTIFICATE_GROUPS.map((group) =>
                S.listItem()
                  .id(group.id)
                  .title(group.title)
                  .icon(DocumentIcon)
                  .child(
                    S.documentTypeList("certificate")
                      .id(group.id)
                      .title(group.title)
                      .filter(group.filter)
                      .apiVersion(apiVersion)
                      .initialValueTemplates(
                        group.templateId
                          ? [S.initialValueTemplateItem(group.templateId)]
                          : [],
                      ),
                  ),
              ),
            ),
        ),
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
