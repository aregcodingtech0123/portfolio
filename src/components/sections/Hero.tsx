"use client";

import type { CSSProperties } from "react";
import { SectionLink } from "@/components/ui/SectionLink";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { buttonClasses } from "@/components/ui/Button";
import { PortraitFrame } from "@/components/ui/PortraitFrame";

// Stagger the entrance by passing each element its own delay. The reveal is
// pure CSS (globals.css, .reveal-load*): it runs on load, finishes without
// a scroll, and is skipped entirely under reduced motion, so the hero is
// always visible -- including with no, slow or failed JavaScript.
function delay(seconds: number): CSSProperties {
  return { "--reveal-delay": `${seconds}s` } as CSSProperties;
}

export function Hero({ portraitSrc }: { portraitSrc?: string }) {
  const { hero } = useSiteContent();

  return (
    <div
      id="home"
      className="relative isolate min-w-0 overflow-x-clip pt-[5.5rem] pb-12 sm:pt-24 sm:pb-14 lg:pb-16 minimal:pt-28 minimal:pb-[var(--rhythm-half)] minimal:sm:pt-32"
    >
      {/* Terminal skin */}
      <div className="relative z-10 mx-auto grid min-w-0 max-w-content grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-12 lg:gap-16 lg:px-8 minimal:hidden">
        <div className="min-w-0">
          <p
            style={delay(0)}
            className="reveal-load-rise decor font-mono text-sm tracking-wide text-accent"
          >
            {hero.eyebrow}
          </p>

          <h1
            style={delay(0.05)}
            className="reveal-load-rise mt-3 font-heading text-3xl font-bold tracking-tight break-words text-foreground sm:text-4xl lg:text-5xl"
          >
            {hero.name}
          </h1>

          <p
            style={delay(0.1)}
            className="reveal-load-rise mt-5 max-w-xl text-base leading-relaxed break-words text-foreground sm:text-lg"
          >
            {hero.headline}
          </p>

          <p
            style={delay(0.14)}
            className="reveal-load-rise mt-4 max-w-xl text-sm leading-relaxed break-words text-muted"
          >
            {hero.subline}
          </p>

          <div style={delay(0.18)} className="reveal-load-rise mt-8 flex flex-wrap gap-3">
            <SectionLink section="projects" className={buttonClasses("primary")}>
              {hero.ctaProjects}
            </SectionLink>
            <SectionLink section="contact" className={buttonClasses("ghost")}>
              {hero.ctaContact}
            </SectionLink>
          </div>
        </div>

        <div
          style={delay(0.12)}
          className="reveal-load-rise flex min-w-0 justify-center md:justify-end"
        >
          <PortraitFrame src={portraitSrc} />
        </div>
      </div>

      {/* Minimal skin */}
      <div className="relative z-10 mx-auto hidden min-w-0 w-full max-w-content-wide grid-cols-1 items-center gap-10 px-5 sm:px-6 md:grid-cols-2 md:gap-12 lg:gap-16 minimal:grid">
        <div className="min-w-0">
          <h1
            style={delay(0.1)}
            className="reveal-load font-heading text-4xl font-normal leading-[1.15] tracking-tight break-words text-foreground sm:text-5xl"
          >
            {hero.name}
          </h1>

          <p
            style={delay(0.18)}
            className="reveal-load mt-5 font-heading text-xl font-normal leading-snug tracking-tight break-words text-foreground sm:text-2xl"
          >
            {hero.headline}
          </p>

          <p
            style={delay(0.26)}
            className="reveal-load mt-5 text-base leading-relaxed break-words text-muted sm:text-[1.05rem]"
          >
            {hero.subline}
          </p>

          <div
            style={delay(0.34)}
            className="reveal-load mt-8 flex flex-wrap gap-x-6 gap-y-3"
          >
            <SectionLink section="projects" className="essay-link text-base text-foreground">
              {hero.ctaProjects}
            </SectionLink>
            <SectionLink section="contact" className="essay-link text-base text-foreground">
              {hero.ctaContact}
            </SectionLink>
          </div>
        </div>

        <div
          style={delay(0.2)}
          className="reveal-load flex min-w-0 justify-center md:justify-end"
        >
          <PortraitFrame src={portraitSrc} />
        </div>
      </div>
    </div>
  );
}
