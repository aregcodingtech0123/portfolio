"use client";

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
};

/**
 * Profile slot. Renders /profile.jpg when it loads; otherwise renders
 * nothing at all and lets the layout reflow around its absence. Terminal
 * skins apply a duotone treatment via `.profile-duotone` unless `natural`
 * is set.
 */
export function ProfilePhoto({
  className = "h-16 w-16",
  alt = "Profile photo",
  natural = false,
}: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div
      className={`${natural ? "relative overflow-hidden bg-transparent" : "profile-duotone relative overflow-hidden rounded-sm border border-border"} ${className}`.trim()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- intentional: graceful missing-file fallback */}
      <img
        src="/profile.jpg"
        alt={alt}
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full ${natural ? "object-contain object-top" : "object-cover"}`}
      />
    </div>
  );
}
