"use client";

import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { CtfDisplay } from "@/sanity/types";

function formatSolvedDate(date: string, locale: string): string {
  try {
    return new Date(date).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

type CtfProps = {
  ctfs: CtfDisplay[];
};

export function Ctf({ ctfs }: CtfProps) {
  const t = useTranslations("CTF");
  const locale = useLocale();

  return (
    <Section id="ctf" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:max-w-content-wide minimal:px-5 sm:minimal:px-6">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 minimal:text-3xl minimal:font-normal">
            {t("subtitle")}
          </h2>
          <p className="mt-4 text-left text-sm leading-relaxed text-muted minimal:text-base">
            {t("intro")}
          </p>
        </div>

        {ctfs.length === 0 ? (
          <p className="mt-12 font-mono text-sm text-muted minimal:font-body minimal:text-base">
            {t("empty")}
          </p>
        ) : (
          <>
            {/* Terminal table */}
            <div className="mt-10 min-w-0 border-t border-border minimal:hidden">
              <div className="hairline-b hidden border-b border-border pb-2 font-mono text-[10px] tracking-wider text-muted uppercase md:grid md:grid-cols-[minmax(0,1.4fr)_7rem_minmax(0,0.8fr)_5rem_minmax(0,0.7fr)] md:gap-4">
                <span>{t("colEvent")}</span>
                <span>{t("colDate")}</span>
                <span>{t("colCategory")}</span>
                <span>{t("colRank")}</span>
                <span>{t("colWriteup")}</span>
              </div>

              <ul className="font-mono text-sm">
                {ctfs.map((entry, index) => {
                  const event = entry.eventName || entry.title;
                  const category = entry.category || entry.difficulty;
                  const zebra = index % 2 === 1;

                  return (
                    <li
                      key={entry.id}
                      className={`grid gap-2 border-b border-border py-3 transition-colors md:grid-cols-[minmax(0,1.4fr)_7rem_minmax(0,0.8fr)_5rem_minmax(0,0.7fr)] md:items-center md:gap-4 ${
                        zebra ? "bg-border/25" : ""
                      }`}
                    >
                      <div className="min-w-0 px-1 md:px-0">
                        <p className="text-[10px] tracking-wider text-muted uppercase md:hidden">
                          {t("colEvent")}
                        </p>
                        <p className="break-words text-foreground">
                          <span className="text-muted">{entry.platform}</span>
                          <span className="mx-1.5 text-muted">/</span>
                          {event}
                        </p>
                        {entry.eventName && entry.title !== entry.eventName && (
                          <p className="mt-0.5 text-[11px] text-muted">
                            {entry.title}
                          </p>
                        )}
                      </div>

                      <div className="px-1 md:px-0">
                        <p className="text-[10px] tracking-wider text-muted uppercase md:hidden">
                          {t("colDate")}
                        </p>
                        <p className="text-muted">
                          {formatSolvedDate(entry.dateSolved, locale)}
                        </p>
                      </div>

                      <div className="px-1 md:px-0">
                        <p className="text-[10px] tracking-wider text-muted uppercase md:hidden">
                          {t("colCategory")}
                        </p>
                        <p className="text-foreground">{category}</p>
                      </div>

                      <div className="px-1 md:px-0">
                        <p className="text-[10px] tracking-wider text-muted uppercase md:hidden">
                          {t("colRank")}
                        </p>
                        <p className="text-foreground">
                          {entry.placement || "—"}
                        </p>
                      </div>

                      <div className="px-1 md:px-0">
                        <p className="text-[10px] tracking-wider text-muted uppercase md:hidden">
                          {t("colWriteup")}
                        </p>
                        {entry.writeupUrl ? (
                          <a
                            href={entry.writeupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline-offset-2 hover:underline"
                          >
                            {t("writeupLink")}
                          </a>
                        ) : (
                          <span className="text-muted">{t("noWriteup")}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Minimal: plain table, hairline under header only */}
            <div className="mt-12 hidden min-w-0 overflow-x-auto minimal:block">
              <table className="w-full min-w-[36rem] border-collapse text-left text-base">
                <thead>
                  <tr className="hairline-b border-b border-border text-sm text-muted">
                    <th className="pb-2.5 pr-4 font-normal">{t("colEvent")}</th>
                    <th className="pb-2.5 pr-4 font-normal">{t("colDate")}</th>
                    <th className="pb-2.5 pr-4 font-normal">{t("colCategory")}</th>
                    <th className="pb-2.5 pr-4 font-normal">{t("colRank")}</th>
                    <th className="pb-2.5 font-normal">{t("colWriteup")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ctfs.map((entry) => {
                    const event = entry.eventName || entry.title;
                    const category = entry.category || entry.difficulty;
                    return (
                      <tr key={entry.id} className="align-top">
                        <td className="py-3.5 pr-4 text-foreground">
                          <span className="text-muted">{entry.platform}</span>
                          <span className="mx-1.5 text-muted">/</span>
                          {event}
                          {entry.eventName && entry.title !== entry.eventName && (
                            <span className="mt-0.5 block text-sm text-muted">
                              {entry.title}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 whitespace-nowrap font-code text-sm text-muted tabular-nums">
                          {formatSolvedDate(entry.dateSolved, locale)}
                        </td>
                        <td className="py-3.5 pr-4 text-foreground">
                          {category}
                        </td>
                        <td className="py-3.5 pr-4 font-code text-sm text-foreground tabular-nums">
                          {entry.placement || "—"}
                        </td>
                        <td className="py-3.5">
                          {entry.writeupUrl ? (
                            <a
                              href={entry.writeupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="essay-link text-foreground"
                            >
                              {t("writeupLink")}
                            </a>
                          ) : (
                            <span className="text-muted">{t("noWriteup")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
