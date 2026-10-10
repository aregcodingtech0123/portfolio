"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { buttonClasses } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { StatusLine, type StatusKind } from "@/components/ui/StatusLine";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectModal } from "@/components/projects/ProjectModal";
import type { ProjectDisplay } from "@/sanity/fetch";
import type { ProjectCategory, ProjectStatus } from "@/sanity/types";

type FilterKey = "all" | ProjectCategory;

function statusMeta(status?: ProjectStatus): {
  kind: StatusKind;
  label: string;
  key: "live" | "wip" | "archived";
} {
  if (status === "wip") return { kind: "pending", label: "WIP", key: "wip" };
  if (status === "archived")
    return { kind: "archived", label: "ARCHIVED", key: "archived" };
  return { kind: "live", label: "LIVE", key: "live" };
}

function ProjectStatusChip({ status }: { status?: ProjectStatus }) {
  const t = useTranslations("Status");
  const { kind, label, key } = statusMeta(status);
  return <StatusLine status={kind} label={label} plain={t(key)} />;
}

function ProjectLinks({
  entry,
  githubLabel,
  liveLabel,
}: {
  entry: ProjectDisplay;
  githubLabel: string;
  liveLabel: string;
}) {
  if (!entry.githubUrl && !entry.liveUrl) return null;

  return (
    <div className="flex flex-wrap gap-2 minimal:gap-x-5 minimal:gap-y-2">
      {entry.githubUrl && (
        <>
          <a
            href={entry.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonClasses("ghost", "px-3 py-1.5 text-xs")} minimal:hidden`}
          >
            {githubLabel}
          </a>
          <a
            href={entry.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="essay-link hidden text-sm text-foreground minimal:inline"
          >
            {githubLabel}
          </a>
        </>
      )}
      {entry.liveUrl && (
        <>
          <a
            href={entry.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonClasses("primary", "px-3 py-1.5 text-xs")} minimal:hidden`}
          >
            {liveLabel}
          </a>
          <a
            href={entry.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="essay-link hidden text-sm text-foreground minimal:inline"
          >
            {liveLabel}
          </a>
        </>
      )}
    </div>
  );
}

function ProjectRow({ entry }: { entry: ProjectDisplay }) {
  const t = useTranslations("Projects");

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="group border-b border-border py-4 transition-colors hover:border-accent sm:grid sm:grid-cols-[5.5rem_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:px-1"
    >
      <div className="hidden items-center justify-between gap-3 sm:block">
        <span className="decor font-mono text-[11px] text-muted">
          {entry.code ?? "—"}
        </span>
        <div className="sm:mt-1">
          <ProjectStatusChip status={entry.status} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:hidden">
        <span className="decor font-mono text-[11px] text-muted">
          {entry.code ?? "—"}
        </span>
        <ProjectStatusChip status={entry.status} />
      </div>

      <div className="mt-3 min-w-0 sm:mt-0">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
          {t("tableTitle")}
        </p>
        <p className="font-heading text-base font-semibold break-words text-foreground">
          {entry.title}
        </p>
      </div>

      <div className="mt-3 min-w-0 sm:mt-0">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
          {t("tableSummary")}
        </p>
        <p className="line-clamp-2 text-sm leading-relaxed break-words text-muted">
          {entry.description}
        </p>
      </div>

      <div className="mt-3 min-w-0 sm:mt-0">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase sm:hidden">
          {t("tableStack")}
        </p>
        <div className="flex flex-wrap gap-1">
          {entry.technologies.slice(0, 4).map((tech) => (
            <Tag key={tech} className="text-[10px]">
              {tech}
            </Tag>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-0 sm:justify-self-end">
        <ProjectLinks
          entry={entry}
          githubLabel={t("github")}
          liveLabel={t("demo")}
        />
      </div>
    </motion.li>
  );
}

function EssayCaseFields({ entry }: { entry: ProjectDisplay }) {
  const t = useTranslations("Projects");
  const fields = (
    [
      entry.problem ? { label: t("fieldProblem"), body: entry.problem } : null,
      entry.approach
        ? { label: t("fieldApproach"), body: entry.approach }
        : null,
      entry.challenge
        ? { label: t("fieldChallenge"), body: entry.challenge }
        : null,
      entry.learned ? { label: t("fieldLearned"), body: entry.learned } : null,
    ] as const
  ).filter((item): item is { label: string; body: string } => item !== null);

  if (fields.length === 0) return null;

  return (
    <div className="mt-6 space-y-5">
      {fields.map((field) => (
        <div key={field.label}>
          <p className="text-xs font-medium tracking-[0.08em] text-muted uppercase italic sm:text-[0.7rem]">
            {field.label}
          </p>
          <p className="mt-1.5 text-base leading-relaxed text-foreground">
            {field.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function EssayFeaturedArticle({ entry }: { entry: ProjectDisplay }) {
  const t = useTranslations("Projects");

  return (
    <article className="min-w-0">
      <h3 className="font-heading text-2xl font-normal tracking-tight break-words text-foreground sm:text-3xl">
        {entry.title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-muted">
        {entry.description}
      </p>

      <EssayCaseFields entry={entry} />

      {entry.imageUrl && (
        <figure className="mt-8">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt || entry.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
          <figcaption className="mt-2 text-sm text-muted">
            {entry.imageAlt || entry.title}
          </figcaption>
        </figure>
      )}

      <div className="mt-6">
        <ProjectLinks
          entry={entry}
          githubLabel={t("github")}
          liveLabel={t("demo")}
        />
      </div>
    </article>
  );
}

function EssayOtherItem({ entry }: { entry: ProjectDisplay }) {
  const t = useTranslations("Projects");

  return (
    <li className="min-w-0 py-5">
      <h3 className="font-heading text-lg font-normal tracking-tight break-words text-foreground sm:text-xl">
        {entry.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">
        {entry.description}
      </p>
      <div className="mt-3">
        <ProjectLinks
          entry={entry}
          githubLabel={t("github")}
          liveLabel={t("demo")}
        />
      </div>
    </li>
  );
}

type ProjectsProps = {
  projects: ProjectDisplay[];
};

export function Projects({ projects: projectData }: ProjectsProps) {
  const t = useTranslations("Projects");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeProject, setActiveProject] = useState<ProjectDisplay | null>(
    null,
  );

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
          p.description.toLowerCase().includes(q) ||
          (p.code?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [filter, query, projectData]);

  const featured = filtered.filter((p) => p.featured);
  const others = filtered.filter((p) => !p.featured);

  const chips: { id: FilterKey; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "ai", label: t("filterAi") },
    { id: "fullstack", label: t("filterFullstack") },
    { id: "security", label: t("filterSecurity") },
    { id: "tooling", label: t("filterTooling") },
  ];

  const empty = projectData.length === 0;

  const openProject = useCallback((project: ProjectDisplay) => {
    setActiveProject(project);
  }, []);

  const closeProject = useCallback(() => {
    setActiveProject(null);
  }, []);

  return (
    <Section id="projects" className="py-20 sm:py-24 minimal:py-20 minimal:sm:py-28">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:px-5 sm:minimal:px-6">
        <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-end lg:justify-between minimal:block">
          <div className="min-w-0 max-w-2xl minimal:max-w-none">
            <p className="decor font-mono text-xs tracking-wide text-accent">
              {t("sectionLabel")}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 minimal:text-[1.75rem] minimal:font-normal minimal:sm:text-3xl">
              {t("subtitle")}
            </h2>
            <p className="mt-3 max-w-xl text-left text-sm leading-relaxed text-muted sm:text-base minimal:mt-4 minimal:max-w-none">
              {t("intro")}
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-md minimal:mt-8 minimal:max-w-none">
            <label className="hairline-b flex min-w-0 items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 focus-within:border-accent minimal:rounded-none minimal:border-0 minimal:border-b minimal:border-border minimal:bg-transparent minimal:px-0 minimal:py-2.5 minimal:focus-within:border-foreground">
              <span className="shrink-0 font-mono text-xs text-accent minimal:hidden">
                {t("grepPrefix")}
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted minimal:font-body minimal:text-sm"
                type="search"
                aria-label={t("searchPlaceholder")}
              />
            </label>

            <div className="flex flex-wrap gap-1.5 minimal:gap-x-4 minimal:gap-y-2">
              {chips.map((c) => {
                const active = filter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilter(c.id)}
                    className={`touch-manipulation rounded-sm border px-2.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-150 minimal:rounded-none minimal:border-0 minimal:bg-transparent minimal:px-0 minimal:py-0.5 minimal:font-body minimal:text-sm minimal:tracking-normal ${
                      active
                        ? "border-accent bg-accent text-on-accent minimal:bg-transparent minimal:text-foreground minimal:underline minimal:underline-offset-[0.22em]"
                        : "border-border bg-transparent text-muted hover:border-accent hover:text-accent minimal:hover:border-0 minimal:hover:text-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {empty && (
          <div className="mt-10 border border-border px-5 py-4 minimal:border-0 minimal:px-0">
            <p className="font-mono text-sm text-accent minimal:font-body minimal:font-normal minimal:text-foreground">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              {t("emptyBody")}
            </p>
          </div>
        )}

        {!empty && (
          <>
            {/* Terminal layouts */}
            <div className="mt-12 space-y-14 minimal:hidden">
              {featured.length > 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {featured.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className="relative z-0"
                      >
                        <ProjectCard entry={p} onOpen={openProject} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {others.length > 0 && (
                <div>
                  <p className="decor mb-4 font-mono text-xs tracking-wide text-muted">
                    {t("otherHeading")}
                  </p>

                  <div className="hidden border-b border-border pb-2 font-mono text-[10px] tracking-wider text-muted uppercase sm:grid sm:grid-cols-[5.5rem_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:gap-4 sm:px-1">
                    <span>{t("tableId")}</span>
                    <span>{t("tableTitle")}</span>
                    <span>{t("tableSummary")}</span>
                    <span>{t("tableStack")}</span>
                    <span className="justify-self-end">{t("tableLinks")}</span>
                  </div>

                  <ul className="min-w-0">
                    <AnimatePresence mode="popLayout">
                      {others.map((p) => (
                        <ProjectRow key={p.id} entry={p} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              )}

              {filtered.length === 0 && (
                <p className="font-mono text-sm text-muted">{t("emptyList")}</p>
              )}
            </div>

            {/* Minimal: essay articles + simple list */}
            <div className="mt-14 hidden space-y-16 minimal:block">
              {featured.length > 0 && (
                <div className="space-y-16">
                  {featured.map((p) => (
                    <EssayFeaturedArticle key={p.id} entry={p} />
                  ))}
                </div>
              )}

              {others.length > 0 && (
                <div>
                  <p className="font-heading text-xl font-normal tracking-tight text-foreground sm:text-2xl">
                    {t("otherHeading").replace(/^\/\/\s*/, "")}
                  </p>
                  <ul className="mt-2 divide-y divide-border/60">
                    {others.map((p) => (
                      <EssayOtherItem key={p.id} entry={p} />
                    ))}
                  </ul>
                </div>
              )}

              {filtered.length === 0 && (
                <p className="text-sm text-muted">{t("emptyList")}</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="minimal:hidden">
        <ProjectModal
          project={activeProject}
          open={activeProject !== null}
          onClose={closeProject}
        />
      </div>
    </Section>
  );
}
