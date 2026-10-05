"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { InteractiveTerminal } from "@/components/about/InteractiveTerminal";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function About() {
  const t = useTranslations("About");
  const { about } = useSiteContent();

  return (
    <Section id="about" className="py-16 sm:py-20">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent ">
            {t("title")}
          </p>
          <h2 className="mt-4 max-w-4xl text-2xl font-bold leading-snug tracking-tight text-balance text-foreground break-words hyphens-auto  sm:text-3xl lg:text-4xl">
            {about.summary}
          </h2>
        </div>

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:mt-14">
          <div className="bg-surface border border-border min-w-0 rounded-md p-6 sm:p-8 md:p-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-md bg-surface    ">
                  <span className="text-4xl font-bold text-foreground">AE</span>
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("locationLabel")}
                  </p>
                  <p className="mt-1 text-lg font-medium text-foreground ">
                    {about.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("educationTitle")}
                  </p>
                  <ul className="mt-2 space-y-2 text-muted ">
                    <li>{about.edu1}</li>
                    <li>{about.edu2}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-border/90 pt-8 ">
              <p className="text-sm font-semibold text-foreground ">
                {about.experienced}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {about.highlights.map((text, i) => (
                  <motion.span
                    key={`${text}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-md border border-border/80 bg-surface/60 px-3 py-1.5 text-xs font-medium text-foreground   "
                  >
                    {text}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <InteractiveTerminal />
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {(
                [
                  ["focus", "focusValue"],
                  ["stack", "stackValue"],
                  ["mindset", "mindsetValue"],
                ] as const
              ).map(([labelKey, valueKey], i) => (
                <motion.div
                  key={labelKey}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * i }}
                  className="bg-surface border border-border rounded-md p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {about.stats[labelKey]}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-accent ">
                    {about.stats[valueKey]}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
