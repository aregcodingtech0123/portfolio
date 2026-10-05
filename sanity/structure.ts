import type { StructureResolver } from "sanity/structure";
import {
  CogIcon,
  DocumentIcon,
  CaseIcon,
  RocketIcon,
  SparklesIcon,
  LockIcon,
} from "@sanity/icons";

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
      S.documentTypeListItem("certificate")
        .title("Certificates")
        .icon(DocumentIcon),
      S.documentTypeListItem("skillCategory")
        .title("Skill categories")
        .icon(SparklesIcon),
      S.documentTypeListItem("skill")
        .title("Skills")
        .icon(SparklesIcon),
      S.documentTypeListItem("ctf")
        .title("CTF challenges")
        .icon(LockIcon),
    ]);
