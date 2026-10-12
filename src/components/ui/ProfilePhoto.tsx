"use client";

import Image from "next/image";
import { useState } from "react";

type ProfilePhotoProps = {
  /** Display size class, e.g. "h-16 w-16" or "h-40 w-40". */
  className?: string;
  alt?: string;
  /**
   * Skip the terminal duotone filter. Used by the minimal hero portrait.
   * Prefer this over fighting the CSS filter from the caller.
   */
  natural?: boolean;
  /**
   * Rendered width of the box, for the browser's source selection. Keep it in
   * step with `className`; the default matches the "h-40 w-40" used in About.
   */
  sizes?: string;
};

/**
 * Profile slot. Renders /images/profilephoto.jpeg through next/image when it
 * loads; otherwise renders nothing at all and lets the layout reflow around
 * its absence. Terminal skins apply a duotone treatment via `.profile-duotone`
 * unless `natural` is set.
 *
 * The image is lazy (the default). That matters twice: it sits below the fold
 * on phones, and the skin that does not show it keeps the whole block at
 * `display: none`, where a lazy image is never requested.
 */
export function ProfilePhoto({
  className = "h-16 w-16",
  alt = "Arda Ege Tunç - Profile Photo",
  natural = false,
  sizes = "160px",
}: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div
      className={`${natural ? "relative overflow-hidden bg-transparent" : "profile-duotone relative overflow-hidden rounded-sm border border-border"} ${className}`.trim()}
    >
      <Image
        src="/images/profilephoto.jpeg"
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        className={natural ? "object-contain object-top" : "object-cover object-center"}
      />
    </div>
  );
}
