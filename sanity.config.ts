import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import { studioTheme } from "./sanity/theme";
import { apiVersion, dataset, projectId } from "./sanity/env";

export default defineConfig({
  name: "portfolio-content-hub",
  title: "Arda Ege Tunç · Content Hub",
  projectId: projectId || "missing-project-id",
  dataset: dataset || "production",
  basePath: "/content-hub",
  theme: studioTheme,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev.filter(
        (template) =>
          template.id !== "skill-by-category" &&
          template.id !== "certificate" &&
          template.id !== "certificate-education" &&
          template.id !== "certificate-participation",
      ),
      {
        id: "skill-by-category",
        title: "Skill",
        schemaType: "skill",
        parameters: [
          { name: "category", type: "string" },
          { name: "categoryOrder", type: "number" },
        ],
        value: (params: { category?: string; categoryOrder?: number }) => ({
          category: params.category,
          categoryOrder: params.categoryOrder ?? 0,
          featured: false,
          order: 0,
        }),
      },
      {
        id: "certificate-education",
        title: "Eğitim sertifikası",
        schemaType: "certificate",
        value: { category: "education" },
      },
      {
        id: "certificate-participation",
        title: "Etkinlik katılımı",
        schemaType: "certificate",
        value: { category: "participation" },
      },
    ],
  },
});
