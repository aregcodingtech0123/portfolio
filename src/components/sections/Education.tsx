"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { EducationItem } from "@/types/content";

function programTitle(item: EducationItem): string {
  const parts = [item.degree, item.fieldOfStudy].filter(Boolean);
  return parts.join(" · ");
}

export function Education({ items }: { items: EducationItem[] }) {
  const t = useTranslations("Education");

  return (
    <Section id="education" className="py-16 sm:py-24">
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
                    const title = programTitle(item);
                    return (
                      <li key={item.id} className="relative pl-8 md:pl-10">
                        <span
                          className="absolute top-1.5 left-0 h-3.5 w-3.5 rounded-sm border border-accent bg-background md:left-0.5"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          {item.period && (
                            <p className="font-mono text-xs tracking-wide text-muted">
                              {item.period}
                            </p>
                          )}
                          <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight break-words text-foreground sm:text-xl">
                            {title}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {item.institution}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Minimal: chronological prose list */}
              <ol className="hidden minimal:block">
                {items.map((item) => {
                  const title = programTitle(item);
                  return (
                    <li
                      key={item.id}
                      className="hairline-b min-w-0 border-b border-border py-8 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <h3 className="font-heading text-xl font-normal tracking-tight break-words text-foreground sm:text-2xl">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-base text-muted">
                        {item.institution}
                      </p>
                      {item.period && (
                        <p className="mt-1 text-sm text-muted">{item.period}</p>
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
