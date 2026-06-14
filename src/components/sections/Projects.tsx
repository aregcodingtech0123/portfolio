"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/ui/Section";
import type { ProjectDisplay } from "@/sanity/fetch";
import type { ProjectCategory } from "@/data/projects";

type FilterKey = "all" | ProjectCategory;

function ProjectCard({
  entry,
  placeholder,
}: {
  entry?: ProjectDisplay;
  placeholder?: boolean;
}) {
  const t = useTranslations("Projects");

  const title = placeholder ? t("slotTitle") : entry?.title ?? "";
  const description = placeholder ? t("slotDescription") : entry?.description ?? "";
  const tech = placeholder ? [t("slotTechHint")] : entry?.technologies ?? [];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`glass-panel flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 transition hover:border-sky-400/50 hover:shadow-[0_12px_40px_rgba(14,165,233,0.12)] dark:border-transparent dark:bg-transparent dark:hover:border-sky-500/30 dark:hover:shadow-[0_0_40px_rgba(56,189,248,0.12)] ${
        placeholder
          ? "border-dashed border-slate-300/90 dark:border-slate-600/60"
          : ""
      }`}
    >
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        {entry?.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt={entry.imageAlt || entry.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <>
            <div className="absolute inset-0 grid-overlay opacity-30 dark:opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-500">
              {t("preview")}
            </div>
          </>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 bg-white/80 p-5 sm:bg-white/90 sm:p-6 dark:bg-transparent">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold break-words text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed break-words text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
            {t("slotTech")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tech.map((tag) => (
              <span
                key={tag}
                className="max-w-full rounded-lg border border-sky-200/80 bg-sky-50 px-2.5 py-1 text-xs font-medium break-words text-slate-800 ring-0 dark:border-transparent dark:bg-slate-900/80 dark:text-sky-200 dark:ring-1 dark:ring-slate-700/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto flex min-w-0 flex-wrap gap-3 pt-2">
          {entry?.githubUrl ? (
            <a
              href={entry.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-manipulation rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200 dark:shadow-none dark:hover:bg-sky-500/20"
            >
              {t("github")}
            </a>
          ) : (
            <span className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400 dark:border-slate-700/70 dark:bg-transparent dark:text-slate-500">
              {t("github")}
            </span>
          )}
          {entry?.liveUrl ? (
            <a
              href={entry.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-manipulation rounded-lg border border-sky-500/50 bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600 hover:shadow-md dark:border-cyan-500/40 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-sky-500/15 dark:text-cyan-100 dark:shadow-none dark:hover:from-cyan-500/30 dark:hover:to-sky-500/25"
            >
              {t("demo")}
            </a>
          ) : (
            <span className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400 dark:border-slate-700/70 dark:bg-transparent dark:text-slate-500">
              {t("demo")}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

type ProjectsProps = {
  projects: ProjectDisplay[];
};

export function Projects({ projects: projectData }: ProjectsProps) {
  const t = useTranslations("Projects");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    let list = projectData;
    if (filter !== "all") {
      list = list.filter((p) => p.category === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.technologies.some((x) => x.toLowerCase().includes(q)) ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, query, projectData]);

  const chips: { id: FilterKey; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "ai", label: t("filterAi") },
    { id: "fullstack", label: t("filterFullstack") },
    { id: "security", label: t("filterSecurity") },
    { id: "tooling", label: t("filterTooling") },
  ];

  const showPlaceholders = projectData.length === 0;

  return (
    <Section id="projects" className="py-24 sm:py-28">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-400/90">
              {t("title")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-surface">
              {t("subtitle")}
            </h2>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-sky-500/0 transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/50 dark:bg-slate-950/60 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-sky-500/60 dark:focus:ring-sky-500/30"
              type="search"
              aria-label={t("searchPlaceholder")}
            />
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilter(c.id)}
                  className={`touch-manipulation rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    filter === c.id
                      ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                      : "border border-slate-300 bg-white text-slate-600 shadow-sm hover:border-sky-400 hover:text-sky-800 dark:border-slate-600/50 dark:bg-slate-900/50 dark:text-slate-400 dark:shadow-none dark:hover:border-sky-500/40 dark:hover:text-slate-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showPlaceholders && (
          <div className="mt-10 rounded-2xl border border-sky-200/80 bg-sky-50/80 px-6 py-5 dark:border-sky-500/20 dark:bg-sky-500/5">
            <p className="font-semibold text-sky-900 dark:text-sky-100">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t("emptyBody")}
            </p>
          </div>
        )}

        <div className="mt-12 grid min-w-0 gap-8 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {!showPlaceholders &&
              filtered.map((p) => <ProjectCard key={p.id} entry={p} />)}
            {showPlaceholders &&
              [0, 1, 2].map((i) => (
                <ProjectCard key={`slot-${i}`} placeholder />
              ))}
          </AnimatePresence>
        </div>

        {!showPlaceholders && filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-600 dark:text-slate-500">
            {t("emptyBody")}
          </p>
        )}
      </div>
    </Section>
  );
}
