"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { SimpleTimelineRow } from "@/components/ui/SimpleTimeline";
import { isOpenEndedPeriod } from "@/lib/period";
import type { ExperienceItem } from "@/types/content";

export function Experience({ items }: { items: ExperienceItem[] }) {
  const t = useTranslations("Experience");

  return (
    <Section id="experience" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 m-container">
        <div className="min-w-0 max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 m-h2 m-h2-statement">
            {t("subtitle")}
          </h2>
        </div>

        <div className="relative mx-auto mt-14 min-w-0 max-w-3xl minimal:mt-[var(--space-group)] minimal:max-w-none">
          {items.length === 0 ? (
            <p className="font-mono text-sm text-muted minimal:font-body minimal:text-base">
              {t("emptyBody")}
            </p>
          ) : (
            <>
              {/* Terminal timeline */}
              <div className="minimal:hidden">
                <div
                  className="pointer-events-none absolute top-2 bottom-2 left-[7px] w-px bg-border md:left-[9px]"
                  aria-hidden
                />
                <ol className="space-y-10">
                  {items.map((item) => (
                    <li
                      key={`${item.company}-${item.period}-${item.role}`}
                      className="relative pl-8 md:pl-10"
                    >
                      <span
                        className="absolute top-1.5 left-0 h-3.5 w-3.5 rounded-sm border border-accent bg-background md:left-0.5"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-mono text-xs tracking-wide text-muted">
                          {item.period}
                        </p>
                        <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight break-words text-foreground sm:text-xl">
                          {item.role}
                          <span className="text-muted"> @ </span>
                          {item.company}
                          {item.location ? (
                            <span className="font-normal text-muted">
                              {` · ${item.location}`}
                            </span>
                          ) : null}
                        </h3>
                        {item.description && (
                          <p className="mt-3 text-sm leading-relaxed break-words text-muted">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Minimal: two-column timeline */}
              <ol className="m-tl m-stagger hidden minimal:block">
                {items.map((item) => (
                  <SimpleTimelineRow
                    key={`${item.company}-${item.period}-${item.role}`}
                    period={item.period}
                    current={isOpenEndedPeriod(item.period)}
                    currentLabel={t("current")}
                    title={item.role}
                    org={item.company}
                    location={item.location}
                    description={item.description}
                  />
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
