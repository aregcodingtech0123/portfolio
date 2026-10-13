"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { formatCertDate, groupByYear, sortByRecency } from "@/lib/cert-date";
import type { CertificateDisplay } from "@/sanity/fetch";

/** Rows shown before "Show all" in the Simple skin. */
const SIMPLE_VISIBLE_CERTS = 6;
const SIMPLE_VISIBLE_EVENTS = 8;

type CertificatesProps = {
  /** The Terminal skin label, e.g. "// 03 projects", numbered and translated by the page. */
  sectionLabel: string;
  educationCertificates: CertificateDisplay[];
  participationCertificates: CertificateDisplay[];
};

const TABLE_GRID =
  "sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(6rem,8.5rem)] sm:gap-4";

function CertificateTable({
  items,
  labels,
  locale,
}: {
  items: CertificateDisplay[];
  labels: { title: string; issuer: string; date: string };
  locale: string;
}) {
  const sorted = useMemo(() => sortByRecency(items), [items]);

  return (
    <div className="min-w-0">
      <div
        className={`hidden border-b border-border pb-2 font-mono text-[10px] tracking-wider text-muted uppercase ${TABLE_GRID}`}
      >
        <span>{labels.title}</span>
        <span>{labels.issuer}</span>
        <span className="sm:text-right">{labels.date}</span>
      </div>
      <ul>
        {sorted.map((item, i) => (
          <li
            key={`${item.title}-${item.issuer}-${i}`}
            className={`grid gap-1 border-b border-border py-3 last:border-b-0 sm:items-baseline ${TABLE_GRID}`}
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
                {labels.title}
              </p>
              <p className="text-sm break-words text-foreground">{item.title}</p>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
                {labels.issuer}
              </p>
              <p className="text-sm break-words text-muted">{item.issuer}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
                {labels.date}
              </p>
              <p className="font-mono text-xs tabular-nums text-muted">
                {item.date ? formatCertDate(item.date, locale) : "—"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Simple: one certificate list grouped by year, newest first. Only the first
 * `limit` rows show until the visitor asks for the rest; the other rows stay in
 * the DOM with `hidden`, so the toggle only flips an attribute. `secondary`
 * draws the same rows one step smaller (used for events).
 */
function SimpleCertList({
  title,
  items,
  limit,
  secondary = false,
}: {
  title: string;
  items: CertificateDisplay[];
  limit: number;
  secondary?: boolean;
}) {
  const t = useTranslations("Certificates");
  const locale = useLocale();
  const panelId = `${useId()}-certs`;
  const [expanded, setExpanded] = useState(false);

  const groups = useMemo(() => groupByYear(sortByRecency(items)), [items]);
  const cleanTitle = title.startsWith("// ") ? title.slice(3) : title;
  const canToggle = items.length > limit;

  let seen = 0;
  const rendered = groups.map((group) => {
    const rows = group.items.map((item) => ({
      item,
      hidden: !expanded && seen++ >= limit,
    }));
    return { year: group.year, rows, hidden: rows.every((row) => row.hidden) };
  });

  return (
    <div className={`min-w-0${secondary ? " m-cert-secondary" : ""}`}>
      <h3
        className="m-h3 flex flex-wrap items-baseline gap-x-3 gap-y-1 capitalize"
      >
        <span>{cleanTitle}</span>
        <span className="m-meta tabular-nums">{items.length}</span>
      </h3>

      <div id={panelId} className="m-cert-groups">
        {rendered.map((group) => (
          <div
            key={group.year ?? "undated"}
            className="m-cert-year"
            hidden={group.hidden}
          >
            <h4 className="m-cert-yearlabel">
              {group.year ?? t("undated")}
            </h4>
            <ul className="m-cert-list m-stagger">
              {group.rows.map(({ item, hidden }, i) => (
                <li
                  key={`${item.title}-${item.issuer}-${i}`}
                  className="m-cert-row"
                  hidden={hidden}
                >
                  <p className="m-cert-title break-words">{item.title}</p>
                  <p className="m-cert-issuer break-words">{item.issuer}</p>
                  {item.date && (
                    <p className="m-cert-date">
                      {formatCertDate(item.date, locale)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {canToggle && (
        <button
          type="button"
          className="m-cert-more"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? t("showFewer")
            : t("showAll", { count: items.length })}
        </button>
      )}
    </div>
  );
}

function CategoryAccordion({
  id,
  title,
  count,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;
  const cleanTitle = title.startsWith("// ") ? title.slice(3) : title;

  return (
    <div className="border-b border-border">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full touch-manipulation items-center justify-between gap-4 py-4 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="font-mono text-sm tracking-wide text-foreground">
            {title.startsWith("// ") && <span className="decor">{"// "}</span>}
            {cleanTitle}
          </span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted">
              {String(count).padStart(2, "0")}
            </span>
            <span className="font-mono text-xs text-accent" aria-hidden>
              <span className="decor">{open ? "[-]" : "[+]"}</span>
            </span>
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={open ? "pb-6" : "hidden"}
      >
        {children}
      </div>
    </div>
  );
}

export function Certificates({
  educationCertificates,
  participationCertificates,
  sectionLabel,
}: CertificatesProps) {
  const t = useTranslations("Certificates");
  const locale = useLocale();
  const baseId = useId();
  const [openEducation, setOpenEducation] = useState(true);
  const [openEvents, setOpenEvents] = useState(false);

  const tableLabels = {
    title: t("colTitle"),
    issuer: t("colIssuer"),
    date: t("colDate"),
  };

  return (
    <Section id="certificates" className="py-16 sm:py-24 minimal:[--section-gap:var(--space-section-minor)]">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 m-container">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {sectionLabel}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 m-h2">
            {t("subtitle")}
          </h2>
        </div>

        {/* Terminal: accordion tables */}
        <div className="mt-10 border-t border-border minimal:hidden">
          {educationCertificates.length > 0 && (
            <CategoryAccordion
              id={`${baseId}-education`}
              title={t("certificatesHeading")}
              count={educationCertificates.length}
              open={openEducation}
              onToggle={() => setOpenEducation((v) => !v)}
            >
              <CertificateTable
                items={educationCertificates}
                labels={tableLabels}
                locale={locale}
              />
            </CategoryAccordion>
          )}

          {participationCertificates.length > 0 && (
            <CategoryAccordion
              id={`${baseId}-events`}
              title={t("eventsHeading")}
              count={participationCertificates.length}
              open={openEvents}
              onToggle={() => setOpenEvents((v) => !v)}
            >
              <CertificateTable
                items={participationCertificates}
                labels={tableLabels}
                locale={locale}
              />
            </CategoryAccordion>
          )}
        </div>

        {/* Minimal: certificates grouped by year, then events one step smaller */}
        <div className="hidden min-w-0 minimal:mt-[var(--space-group)] minimal:block">
          {educationCertificates.length > 0 && (
            <SimpleCertList
              title={t("certificatesHeading")}
              items={educationCertificates}
              limit={SIMPLE_VISIBLE_CERTS}
            />
          )}
          {participationCertificates.length > 0 && (
            <div
              className={
                educationCertificates.length > 0
                  ? "mt-[calc(var(--space-group)*1.5)]"
                  : ""
              }
            >
              <SimpleCertList
                title={t("eventsHeading")}
                items={participationCertificates}
                limit={SIMPLE_VISIBLE_EVENTS}
                secondary
              />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
