"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

/** Intrinsic size of the portrait source; gives the browser its aspect ratio before the file arrives. */
const PORTRAIT_WIDTH = 1200;
const PORTRAIT_HEIGHT = 1600;

type PortraitFrameProps = {
  /**
   * Path under `public/`, e.g. `/images/profilephoto.jpeg`. Leave it out when
   * there is no photo: the frame then renders as an intentional empty slot.
   * Whether the file exists is decided on the server (see lib/portrait.ts), so
   * the image can be in the first HTML response instead of waiting on a probe.
   */
  src?: string;
  className?: string;
};

/**
 * Skin-aware portrait slot. Renders the photo when one is configured,
 * otherwise an empty frame (surface fill + hairline border).
 * Uses a 3:4 frame with object-contain so the full photo stays visible.
 */
export function PortraitFrame({ src, className = "" }: PortraitFrameProps) {
  const t = useTranslations("Hero");
  const { hero } = useSiteContent();

  return (
    <figure
      className={`flex flex-col items-center gap-3 ${className}`.trim()}
    >
      <PortraitSlot key={src} src={src} alt={t("portraitAlt")} />
      <figcaption className="decor font-mono text-[11px] tracking-wide text-muted minimal:hidden">
        {hero.profileTagline}
      </figcaption>
    </figure>
  );
}

function PortraitSlot({ src, alt }: { src?: string; alt: string }) {
  /**
   * The file can still fail at runtime (corrupt, deleted after the build).
   * `onError` only fires if it hydrated before the failure, so a ref callback
   * also catches an image that already failed while the server HTML was parsed.
   */
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;

  return (
    <div
      className={[
        "relative w-[clamp(10rem,48vw,15rem)] overflow-hidden bg-surface",
        "aspect-[3/4] border border-accent/70",
        "md:w-[clamp(12rem,26vw,18rem)]",
        /* Terminal: soft squircle. Minimal: rounded rectangle matching essay skin. */
        "rounded-[1.75rem]",
        "minimal:rounded-md minimal:border-2 minimal:border-[color:var(--border-strong)]",
        /* Minimal: hard offset block behind the frame, in the foreground colour. */
        "minimal:shadow-[8px_8px_0_0_var(--foreground)] md:minimal:shadow-[12px_12px_0_0_var(--foreground)]",
      ].join(" ")}
      {...(empty ? { "aria-hidden": true } : {})}
    >
      {src && !failed && (
        <Image
          src={src}
          alt={alt}
          width={PORTRAIT_WIDTH}
          height={PORTRAIT_HEIGHT}
          preload
          sizes="(max-width: 768px) 48vw, 288px"
          className="h-full w-full object-contain object-center"
          onError={() => setFailed(true)}
          ref={(img) => {
            if (img && img.complete && img.naturalWidth === 0) setFailed(true);
          }}
        />
      )}
    </div>
  );
}
