import { defineCliConfig } from "sanity/cli";
import { apiVersion, dataset, projectId } from "./sanity/env";

export default defineCliConfig({
  api: {
    projectId: projectId || "placeholder",
    dataset: dataset || "production",
  },
  studioHost: process.env.SANITY_STUDIO_HOSTNAME,
});
