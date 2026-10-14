"use client";

import type { CSSProperties } from "react";
import { SectionLink } from "@/components/ui/SectionLink";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Hero");
  const { hero, about } = useSiteContent();

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
      <div className="relative z-10 hidden min-w-0 minimal:block">
        <div className="m-container grid min-w-0 grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12 lg:gap-20">
          <div className="min-w-0">
            <p style={delay(0.05)} className="reveal-load m-pill m-meta">
              {t("roleBadge")}
            </p>

            <h1
              style={delay(0.1)}
              className="reveal-load m-display mt-6 break-words text-foreground"
            >
              {hero.name}
            </h1>

            <p
              style={delay(0.18)}
              className="reveal-load m-lead mt-6 max-w-[40ch] break-words text-foreground"
            >
              {t("headline")}
            </p>

            <p
              style={delay(0.26)}
              className="reveal-load mt-5 max-w-[56ch] text-base leading-relaxed break-words text-muted sm:text-lg"
            >
              {hero.subline}
            </p>

            {about.location && (
              <p style={delay(0.3)} className="reveal-load m-meta mt-6">
                {about.location}
              </p>
            )}

            <div
              style={delay(0.34)}
              className="reveal-load mt-8 flex flex-wrap gap-3"
            >
              <SectionLink section="projects" className="m-btn m-btn-primary">
                {hero.ctaProjects}
              </SectionLink>
              <SectionLink section="contact" className="m-btn m-btn-ghost">
                {hero.ctaContact}
              </SectionLink>
            </div>
          </div>

          {/* pb/pr leave room for the portrait's hard shadow. */}
          <div
            style={delay(0.2)}
            className="reveal-load flex min-w-0 justify-center pr-2 pb-2 md:justify-end md:pr-3 md:pb-3"
          >
            <PortraitFrame src={portraitSrc} />
          </div>
        </div>

        {/* Bottom edge: scroll cue only (tagline removed for a cleaner hero). */}
        <div className="m-container mt-[var(--space-group)]">
          <div
            style={delay(0.42)}
            className="reveal-load border-t border-border pt-4"
          >
            <SectionLink section="about" className="m-cue m-eyebrow">
              <span>{t("scrollCue")}</span>
              <svg
                width="12"
                height="14"
                viewBox="0 0 12 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M6 1v11M1.5 7.5 6 12l4.5-4.5" />
              </svg>
            </SectionLink>
          </div>
        </div>
      </div>    </div>
  );
}
