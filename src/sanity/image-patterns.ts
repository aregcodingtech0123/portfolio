import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/**
 * Remote images next/image may optimise. Sanity serves them from
 * https://cdn.sanity.io/images/<projectId>/<dataset>/<file>.
 *
 * With only a hostname, /_next/image would optimise any image on cdn.sanity.io,
 * from any Sanity project: an open image resizer running on this site's
 * server. Scoping the pathname to this project's id limits it to your own
 * images (every dataset of the project, which are all yours).
 *
 * No project id (Sanity not configured) means no remote images at all.
 * The id comes from NEXT_PUBLIC_SANITY_PROJECT_ID at build time, like every
 * NEXT_PUBLIC value, and is validated before it goes into a glob so a stray
 * "*" or "/" cannot widen the pattern.
 */
export function sanityImageRemotePatterns(projectId: string | undefined): RemotePattern[] {
  const id = projectId?.trim();
  if (!id) return [];
  if (!/^[a-z0-9]+$/i.test(id)) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID may only contain letters and digits; refusing to build an image pattern from it.",
    );
  }
  return [
    {
      protocol: "https",
      hostname: "cdn.sanity.io",
      pathname: `/images/${id}/**`,
    },
  ];
}
