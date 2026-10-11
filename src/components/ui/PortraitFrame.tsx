"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const DEFAULT_SRC = "/images/profilephoto.jpeg";

type PortraitFrameProps = {
  /** Path under `public/`, e.g. `/images/profilephoto.jpeg`. */
  src?: string;
  className?: string;
};

/**
 * Skin-aware portrait slot. Renders a configured image when it loads;
 * otherwise keeps an intentional empty frame (surface fill + hairline border).
 * Uses a 3:4 frame with object-contain so the full photo stays visible.
 */
export function PortraitFrame({
  src = DEFAULT_SRC,
  className = "",
}: PortraitFrameProps) {
  const t = useTranslations("Hero");
  const { hero } = useSiteContent();

  return (
    <figure
      className={`flex flex-col items-center gap-3 ${className}`.trim()}
    >
      <PortraitSlot key={src} src={src} alt={t("portraitAlt")} />
      <figcaption className="decor font-mono text-[11px] tracking-wide text-muted">
        {hero.profileTagline}
      </figcaption>
    </figure>
  );
}

function PortraitSlot({ src, alt }: { src: string; alt: string }) {
  /** null = probing, true = file present, false = absent / failed */
  const [available, setAvailable] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const empty = available !== true || !ready;

  useEffect(() => {
    let alive = true;

    fetch(src, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        if (alive) setAvailable(res.ok);
      })
      .catch(() => {
        if (alive) setAvailable(false);
      });

    return () => {
      alive = false;
    };
  }, [src]);

  return (
    <div
      className={[
        "relative w-[clamp(10rem,48vw,15rem)] overflow-hidden bg-surface",
        "aspect-[3/4] border border-accent/70",
        "md:w-[clamp(12rem,26vw,18rem)]",
        /* Terminal: soft squircle. Minimal: rounded rectangle matching essay skin. */
        "rounded-[1.75rem]",
        "minimal:rounded-2xl minimal:border-border",
      ].join(" ")}
      {...(empty ? { "aria-hidden": true } : {})}
    >
      {available === true && (
        <Image
          src={src}
          alt={empty ? "" : alt}
          fill
          priority
          sizes="(max-width: 768px) 48vw, 288px"
          className={`object-contain object-center transition-opacity duration-300 motion-reduce:transition-none ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setReady(true)}
          onError={() => {
            setAvailable(false);
            setReady(false);
          }}
        />
      )}
    </div>
  );
}
