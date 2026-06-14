import { createImageUrlBuilder } from "@sanity/image-url";
import { dataset, projectId } from "../../sanity/env";
import type { SanityImageAsset } from "./types";

const builder =
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset })
    : null;

export function urlFor(source: SanityImageAsset | null | undefined) {
  if (!builder || !source) return null;
  return builder.image(source);
}

export function getImageUrl(
  source: SanityImageAsset | null | undefined,
  width = 800,
  height = 500,
): string | undefined {
  return urlFor(source)?.width(width).height(height).auto("format").url();
}
