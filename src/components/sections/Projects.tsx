"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { buttonClasses } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
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
      className={`flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface transition hover:border-accent ${
        placeholder
          ? "border-dashed border-muted"
          : ""
      }`}
    >
      <div className="relative aspect-[16/10] w-full bg-tag">
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
            <div className="absolute inset-0 bg-tag" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-muted ">
              {t("preview")}
            </div>
          </>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 bg-surface/80 p-5 sm:bg-surface/90 sm:p-6 ">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold break-words text-foreground ">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed break-words text-muted ">
            {description}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted ">
            {t("slotTech")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tech.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
        <div className="mt-auto flex min-w-0 flex-wrap gap-3 pt-2">
          {entry?.githubUrl ? (
            <a
              href={entry.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("ghost", "px-4 py-2 text-xs")}
            >
              {t("github")}
            </a>
          ) : (
            <span className="cursor-not-allowed rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted   ">
              {t("github")}
            </span>
          )}
          {entry?.liveUrl ? (
            <a
              href={entry.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "px-4 py-2 text-xs")}
            >
              {t("demo")}
            </a>
          ) : (
            <span className="cursor-not-allowed rounded-md border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted   ">
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent/90">
              {t("title")}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ">
              {t("subtitle")}
            </h2>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground  outline-none  transition placeholder:text-muted focus:border-accent         "
              type="search"
              aria-label={t("searchPlaceholder")}
            />
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilter(c.id)}
                  className={`touch-manipulation rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    filter === c.id
                      ? "border-accent bg-accent text-on-accent"
                      : "border border-border bg-surface text-muted  hover:border-accent hover:text-accent      "
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showPlaceholders && (
          <div className="mt-10 rounded-md border border-accent/80 bg-accent/80 px-6 py-5  ">
            <p className="font-semibold text-accent ">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted ">
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
          <p className="mt-10 text-center text-sm text-muted ">
            {t("emptyBody")}
          </p>
        )}
      </div>
    </Section>
  );
}
