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
  },
});
