"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { GraduationCap, ScrollText, ChevronRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { CertificateCategoryModal } from "@/components/certificates/CertificateCategoryModal";
import {
  educationCertificates as defaultEducation,
  participationCertificates as defaultParticipation,
  type CertificateItem,
} from "@/data/certificates";

type OpenCategory = "education" | "participation" | null;

type CertificatesProps = {
  educationCertificates?: CertificateItem[];
  participationCertificates?: CertificateItem[];
};

export function Certificates({
  educationCertificates = defaultEducation,
  participationCertificates = defaultParticipation,
}: CertificatesProps) {
  const t = useTranslations("Certificates");
  const [open, setOpen] = useState<OpenCategory>(null);

  return (
    <Section id="certificates" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-400/90">
            {t("title")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-surface sm:text-4xl">
            {t("subtitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {t("intro")}
          </p>
        </div>

        <div className="mt-10 grid min-w-0 gap-5 sm:gap-6 md:grid-cols-2">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => setOpen("education")}
            aria-haspopup="dialog"
            aria-expanded={open === "education"}
            className="group min-w-0 touch-manipulation rounded-3xl border border-sky-500/20 bg-gradient-to-br from-white/90 via-sky-50/40 to-white/80 p-6 text-left shadow-[0_12px_40px_rgba(14,165,233,0.12)] outline-none ring-sky-500/0 transition hover:border-sky-400/40 hover:shadow-[0_16px_48px_rgba(14,165,233,0.18)] focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-sky-500/15 dark:from-slate-950/90 dark:via-sky-950/25 dark:to-slate-950/80 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-sky-400/30"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                <GraduationCap
                  className="h-6 w-6"
                  aria-hidden
                  strokeWidth={1.75}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700 dark:text-sky-300">
                  {t("cardEducationKicker")}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {t("cardEducationTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t("cardEducationBody")}
                </p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 dark:text-sky-300">
                  {t("cardCta")}
                  <ChevronRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              {t("countLabel", { count: educationCertificates.length })}
            </p>
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: 0.06, type: "spring", stiffness: 400, damping: 28 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setOpen("participation")}
            aria-haspopup="dialog"
            aria-expanded={open === "participation"}
            className="group min-w-0 touch-manipulation rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-white/90 via-cyan-50/35 to-white/80 p-6 text-left shadow-[0_12px_40px_rgba(6,182,212,0.12)] outline-none ring-cyan-500/0 transition hover:border-cyan-400/40 hover:shadow-[0_16px_48px_rgba(6,182,212,0.16)] focus-visible:ring-2 focus-visible:ring-cyan-500/35 dark:border-cyan-500/15 dark:from-slate-950/90 dark:via-cyan-950/20 dark:to-slate-950/80 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-cyan-400/28"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200">
                <ScrollText
                  className="h-6 w-6"
                  aria-hidden
                  strokeWidth={1.75}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-800 dark:text-cyan-300">
                  {t("cardParticipationKicker")}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {t("cardParticipationTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t("cardParticipationBody")}
                </p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-800 dark:text-cyan-300">
                  {t("cardCta")}
                  <ChevronRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              {t("countLabel", { count: participationCertificates.length })}
            </p>
          </motion.button>
        </div>
      </div>

      <CertificateCategoryModal
        open={open !== null}
        title={
          open === "education"
            ? t("modalEducationTitle")
            : open === "participation"
              ? t("modalParticipationTitle")
              : ""
        }
        closeLabel={t("modalClose")}
        items={
          open === "education"
            ? educationCertificates
            : open === "participation"
              ? participationCertificates
              : []
        }
        onClose={() => setOpen(null)}
      />
    </Section>
  );
}
