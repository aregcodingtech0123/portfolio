import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId, sanityConfigured } from "../../sanity/env";

let client: SanityClient | null = null;

export function getSanityClient(): SanityClient | null {
  if (!sanityConfigured) return null;
  if (!client) {
    client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: process.env.NODE_ENV === "production",
      perspective: "published",
    });
  }
  return client;
}
