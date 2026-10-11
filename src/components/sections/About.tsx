"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { InteractiveTerminal } from "@/components/about/InteractiveTerminal";
import { ProfilePhoto } from "@/components/ui/ProfilePhoto";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function About() {
  const t = useTranslations("About");
  const { about } = useSiteContent();
  const reduceMotion = useReducedMotion();

  const fadeIn = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay, duration: 0.4 },
        };

  const essayIn = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true },
          transition: { delay, duration: 0.45, ease: "easeOut" as const },
        };

  const hasLocation = Boolean(about.location);
  const hasHighlights = about.highlights.length > 0;
  const hasExperienced = Boolean(about.experienced);
  const proseParagraphs = about.paragraphs.filter(Boolean);

  const stats = (
    [
      ["focus", "focusValue"],
      ["stack", "stackValue"],
      ["mindset", "mindsetValue"],
    ] as const
  ).filter(
    ([labelKey, valueKey]) => about.stats[labelKey] && about.stats[valueKey],
  );

  const renderHighlightBadges = () =>
    hasHighlights ? (
      <div className="flex flex-wrap gap-2">
        {about.highlights.map((text, i) => (
          <motion.span
            key={`${text}-${i}`}
            {...fadeIn(i * 0.04)}
            className="rounded-sm border border-border bg-background px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-foreground transition-colors hover:border-accent hover:text-accent minimal:rounded-none minimal:border-border minimal:bg-transparent minimal:font-body minimal:text-xs minimal:tracking-normal minimal:hover:border-foreground minimal:hover:text-foreground"
          >
            {text}
          </motion.span>
        ))}
      </div>
    ) : null;

  return (
    <Section id="about" className="py-16 sm:py-20">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:max-w-content-prose minimal:px-5 sm:minimal:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent minimal:hidden">
            {t("title")}
          </p>
          {about.summary && (
            <h2 className="mt-4 max-w-4xl text-2xl font-bold leading-snug tracking-tight text-balance text-foreground break-words hyphens-auto sm:text-3xl lg:text-4xl minimal:mt-0 minimal:max-w-none minimal:font-heading minimal:text-[1.75rem] minimal:font-normal minimal:leading-snug minimal:tracking-tight minimal:sm:text-3xl">
              {about.summary}
            </h2>
          )}
        </div>

        {/* Terminal layout */}
        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:mt-14 minimal:hidden">
          <div className="min-w-0 rounded-md border border-border bg-surface p-6 sm:p-8 md:p-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <ProfilePhoto className="h-40 w-40" alt="Arda Ege Tunç" />
              </div>
              <div className="flex-1 space-y-6">
                {hasLocation && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {t("locationLabel")}
                    </p>
                    <p className="mt-1 text-lg font-medium text-foreground">
                      {about.location}
                    </p>
                  </div>
                )}
                {proseParagraphs.length > 0 && (
                  <div className="space-y-3 text-sm leading-relaxed text-muted sm:text-base">
                    {proseParagraphs.map((paragraph, i) => (
                      <p key={`${i}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(hasExperienced || hasHighlights) && (
              <div className="mt-10 border-t border-border/90 pt-8">
                {hasExperienced && (
                  <p className="text-sm font-semibold text-foreground">
                    {about.experienced}
                  </p>
                )}
                {hasHighlights && (
                  <div className={hasExperienced ? "mt-4" : ""}>
                    {renderHighlightBadges()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            <motion.div {...fadeIn()}>
              <InteractiveTerminal />
            </motion.div>
            {stats.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {stats.map(([labelKey, valueKey], i) => (
                  <motion.div
                    key={labelKey}
                    {...fadeIn(0.08 * i)}
                    className="rounded-md border border-border bg-surface p-6"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {about.stats[labelKey]}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-accent">
                      {about.stats[valueKey]}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Minimal: written paragraphs + structured skill chips */}
        <div className="mt-12 hidden minimal:block">
          {proseParagraphs.length > 0 && (
            <motion.div
              {...essayIn(0.08)}
              className="space-y-5 text-base leading-relaxed text-foreground sm:text-lg"
            >
              {proseParagraphs.map((paragraph, i) => (
                <p key={`${i}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </motion.div>
          )}

          {(hasExperienced || hasHighlights) && (
            <motion.div
              {...essayIn(0.14)}
              className={`hairline-t border-t border-border ${proseParagraphs.length > 0 ? "mt-10 pt-8" : ""}`}
            >
              {hasExperienced && (
                <p className="text-sm tracking-[0.04em] text-muted uppercase">
                  {about.experienced}
                </p>
              )}
              {hasHighlights && (
                <div className={hasExperienced ? "mt-4" : ""}>
                  {renderHighlightBadges()}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Section>
  );
}
