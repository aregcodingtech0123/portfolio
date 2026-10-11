import { createImageUrlBuilder, type ImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "../../sanity/env";
import type { SanityImageAsset } from "./types";

let builder: ImageUrlBuilder | null | undefined;

function getBuilder(): ImageUrlBuilder | null {
  if (builder !== undefined) return builder;
  builder =
    projectId && dataset
      ? createImageUrlBuilder({ projectId, dataset })
      : null;
  return builder;
}

export function urlFor(source: SanityImageAsset | null | undefined) {
  const b = getBuilder();
  if (!b || !source?.asset) return null;
  return b.image(source);
}

export function getImageUrl(
  source: SanityImageAsset | null | undefined,
  width = 800,
  height = 500,
): string | undefined {
  return urlFor(source)?.width(width).height(height).auto("format").url() || undefined;
}
