"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { CertificateDisplay } from "@/sanity/fetch";

type CertificatesProps = {
  educationCertificates: CertificateDisplay[];
  participationCertificates: CertificateDisplay[];
};

function CertificateTable({
  items,
  labels,
}: {
  items: CertificateDisplay[];
  labels: { title: string; issuer: string; date: string };
}) {
  return (
    <div className="min-w-0">
      <div className="hidden border-b border-border pb-2 font-mono text-[10px] tracking-wider text-muted uppercase sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6.5rem] sm:gap-4">
        <span>{labels.title}</span>
        <span>{labels.issuer}</span>
        <span>{labels.date}</span>
      </div>
      <ul>
        {items.map((item, i) => (
          <li
            key={`${item.title}-${item.issuer}-${i}`}
            className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6.5rem] sm:items-baseline sm:gap-4"
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
            <div>
              <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
                {labels.date}
              </p>
              <p className="font-mono text-xs text-muted">{item.date || "—"}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EssayCertificateGroup({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: CertificateDisplay[];
}) {
  const cleanTitle = title.startsWith("// ") ? title.slice(3) : title;

  return (
    <div className="min-w-0">
      <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-heading text-xl font-normal tracking-tight text-foreground sm:text-2xl">
          {cleanTitle}
        </span>
        <span className="text-sm text-muted tabular-nums">{count}</span>
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, i) => (
          <li
            key={`${item.title}-${item.issuer}-${i}`}
            className="text-base leading-relaxed text-foreground"
          >
            <span className="break-words">{item.title}</span>
            <span className="text-muted">
              {" — "}
              {item.issuer}
              {item.date ? ` (${item.date})` : ""}
            </span>
          </li>
        ))}
      </ul>
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
}: CertificatesProps) {
  const t = useTranslations("Certificates");
  const baseId = useId();
  const [openEducation, setOpenEducation] = useState(true);
  const [openEvents, setOpenEvents] = useState(false);

  const tableLabels = {
    title: t("colTitle"),
    issuer: t("colIssuer"),
    date: t("colDate"),
  };

  return (
    <Section id="certificates" className="py-16 sm:py-24 minimal:py-20 minimal:sm:py-28">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:px-5 sm:minimal:px-6">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 minimal:text-[1.75rem] minimal:font-normal minimal:sm:text-3xl">
            {t("subtitle")}
          </h2>
        </div>

        {/* Terminal: accordion tables */}
        <div className="mt-10 border-t border-border minimal:hidden">
          {educationCertificates.length > 0 && (
            <CategoryAccordion
              id={`${baseId}-education`}
              title={t("educationHeading")}
              count={educationCertificates.length}
              open={openEducation}
              onToggle={() => setOpenEducation((v) => !v)}
            >
              <CertificateTable
                items={educationCertificates}
                labels={tableLabels}
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
              />
            </CategoryAccordion>
          )}
        </div>

        {/* Minimal: grouped lists */}
        <div className="mt-12 hidden space-y-12 minimal:block">
          {educationCertificates.length > 0 && (
            <EssayCertificateGroup
              title={t("educationHeading")}
              count={educationCertificates.length}
              items={educationCertificates}
            />
          )}
          {participationCertificates.length > 0 && (
            <EssayCertificateGroup
              title={t("eventsHeading")}
              count={participationCertificates.length}
              items={participationCertificates}
            />
          )}
        </div>
      </div>
    </Section>
  );
}
