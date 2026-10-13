"use client";

import Image from "next/image";
import { useState } from "react";

type ProfilePhotoProps = {
  /** Display size class, e.g. "h-16 w-16" or "h-40 w-40". */
  className?: string;
  alt?: string;
  /**
   * Rendered width of the box, for the browser's source selection. Keep it in
   * step with `className`; the default matches the "h-40 w-40" used in About.
   */
  sizes?: string;
};

/**
 * Profile slot. Renders /images/profilephoto.jpeg through next/image when it
 * loads; otherwise renders nothing at all and lets the layout reflow around
 * its absence. Full color in every skin (no duotone filter).
 *
 * The image is lazy (the default). That matters twice: it sits below the fold
 * on phones, and the skin that does not show it keeps the whole block at
 * `display: none`, where a lazy image is never requested.
 */
export function ProfilePhoto({
  className = "h-16 w-16",
  alt = "Arda Ege Tunç - Profile Photo",
  sizes = "160px",
}: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-border bg-surface ${className}`.trim()}
    >
      <Image
        src="/images/profilephoto.jpeg"
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        className="object-contain object-center"
      />
    </div>
  );
}
