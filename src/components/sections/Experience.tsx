"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { ExperienceItem } from "@/types/content";

function toBullets(detail: string): string[] {
  const byLine = detail
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;
  const single = byLine[0] ?? detail.trim();
  return single ? [single] : [];
}

export function Experience({ items }: { items: ExperienceItem[] }) {
  const t = useTranslations("Experience");

  return (
    <Section id="experience" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:max-w-content-prose minimal:px-5 sm:minimal:px-6">
        <div className="min-w-0 max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 minimal:text-3xl minimal:font-normal">
            {t("subtitle")}
          </h2>
        </div>

        <div className="relative mx-auto mt-14 min-w-0 max-w-3xl minimal:mt-12 minimal:max-w-none">
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
                  {items.map((item) => {
                    const bullets = toBullets(item.detail);
                    return (
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
                          </h3>
                          {bullets.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {bullets.map((bullet) => (
                                <li
                                  key={bullet}
                                  className="flex gap-2 text-sm leading-relaxed text-muted"
                                >
                                  <span
                                    className="mt-2 h-1 w-1 shrink-0 rounded-sm bg-accent"
                                    aria-hidden
                                  />
                                  <span className="min-w-0 break-words">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Minimal: chronological prose list */}
              <ol className="hidden space-y-10 minimal:block">
                {items.map((item) => {
                  const bullets = toBullets(item.detail);
                  return (
                    <li
                      key={`${item.company}-${item.period}-${item.role}`}
                      className="min-w-0"
                    >
                      <h3 className="font-heading text-xl font-normal tracking-tight break-words text-foreground sm:text-2xl">
                        {item.role}
                        <span className="text-muted">, </span>
                        {item.company}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{item.period}</p>
                      {bullets.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="text-base leading-relaxed text-foreground"
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
