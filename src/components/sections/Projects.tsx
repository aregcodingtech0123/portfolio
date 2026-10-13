"use client";

import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectModal } from "@/components/projects/ProjectModal";
import type { ProjectDisplay } from "@/sanity/fetch";
import type { ProjectCategory } from "@/sanity/types";

const PROJECT_QUERY_KEY = "project";

/**
 * Rewrites the query string in place, without a navigation.
 *
 * The page is statically generated. On such a page router.replace() back to
 * the bare pathname does nothing when the visitor arrived through a
 * `?project=` link (the router treats it as the route it is already on), so
 * a deep-linked modal could not be closed. The History API is the supported
 * alternative: the App Router syncs replaceState into useSearchParams, which is
 * what drives the modal.
 */
function replaceQuery(params: URLSearchParams) {
  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

function projectQueryValue(project: ProjectDisplay): string {
  // Prefer slug/id: Sanity docs may omit `code`, and empty strings are falsy.
  return (project.code?.trim() || project.id).trim();
}

function projectMatchesQuery(project: ProjectDisplay, value: string): boolean {
  return (
    project.id === value ||
    (Boolean(project.code) && project.code === value)
  );
}

type FilterKey = "all" | ProjectCategory;

type ProjectsProps = {
  projects: ProjectDisplay[];
};

type ProjectsViewProps = ProjectsProps & {
  activeProject: ProjectDisplay | null;
  onOpen: (project: ProjectDisplay) => void;
  onClose: () => void;
};

function ProjectsView({
  projects: projectData,
  activeProject,
  onOpen,
  onClose,
}: ProjectsViewProps) {
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
          p.description.toLowerCase().includes(q) ||
          (p.code?.toLowerCase().includes(q) ?? false),
      );
    }
    // Featured first; preserve relative order within each group.
    return [...list].sort(
      (a, b) => Number(b.featured) - Number(a.featured),
    );
  }, [filter, query, projectData]);

  const chips: { id: FilterKey; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "ai", label: t("filterAi") },
    { id: "fullstack", label: t("filterFullstack") },
    { id: "security", label: t("filterSecurity") },
    { id: "tooling", label: t("filterTooling") },
  ];

  const empty = projectData.length === 0;

  return (
    <Section id="projects" className="py-20 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 m-container">
        <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-end lg:justify-between minimal:block">
          <div className="min-w-0 max-w-2xl minimal:max-w-none">
            <p className="decor font-mono text-xs tracking-wide text-accent">
              {t("sectionLabel")}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 m-h2">
              {t("subtitle")}
            </h2>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-md minimal:mt-8 minimal:max-w-none minimal:gap-4 md:minimal:flex-row md:minimal:items-center md:minimal:justify-between">
            <label className="hairline-b flex min-w-0 items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 focus-within:border-accent minimal:rounded-[var(--r-sm)] minimal:bg-transparent minimal:px-4 minimal:py-3 md:minimal:w-96 md:minimal:shrink-0 m-search">
              <span className="shrink-0 font-mono text-xs text-accent minimal:hidden">
                {t("grepPrefix")}
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted minimal:font-body minimal:text-base"
                type="search"
                aria-label={t("searchPlaceholder")}
              />
            </label>

            <div className="flex flex-wrap gap-1.5 minimal:gap-2">
              {chips.map((c) => {
                const active = filter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilter(c.id)}
                    className={`touch-manipulation rounded-sm border px-2.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-150 minimal:min-h-10 minimal:rounded-full minimal:px-4 minimal:py-1.5 minimal:font-code minimal:text-xs minimal:tracking-normal ${
                      active
                        ? "border-accent bg-accent text-on-accent minimal:border-[color:var(--foreground)] minimal:bg-foreground minimal:text-background"
                        : "border-border bg-transparent text-muted hover:border-accent hover:text-accent minimal:border-[color:var(--border-strong)] minimal:text-muted minimal:hover:border-[color:var(--foreground)] minimal:hover:text-foreground"
                    }`}
                  >
                    {c.label}
                    {/* Simple only: the Terminal markup has no pressed state to announce. */}
                    {active && (
                      <span className="hidden minimal:block minimal:sr-only">
                        {` ${t("filterSelected")}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {empty && (
          <div className="mt-10 border border-border px-5 py-4 minimal:mt-[var(--space-group)] minimal:rounded-[var(--r-md)] minimal:border-dashed minimal:border-[color:var(--border-strong)] minimal:p-8">
            <p className="font-mono text-sm text-accent minimal:font-heading minimal:text-2xl minimal:font-semibold minimal:tracking-tight minimal:text-foreground">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted minimal:text-base">
              {t("emptyBody")}
            </p>
          </div>
        )}

        {!empty && (
          <>
            {/* Terminal: full project card grid */}
            <div className="mt-12 minimal:hidden">
              {filtered.length > 0 ? (
                <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* initial={false}: the cards paint at their final state on
                      first render (and in the SSR HTML), so they are never
                      hidden with no/slow JS. The enter/exit fade still plays
                      when the category filter changes the list. */}
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filtered.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className="relative z-0 min-h-0 h-full"
                      >
                        <ProjectCard entry={p} onOpen={onOpen} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="font-mono text-sm text-muted">{t("emptyList")}</p>
              )}
            </div>

            {/* Minimal: result count, then equal vertical cards (3-up from lg). */}
            <div className="mt-12 hidden min-w-0 minimal:mt-[var(--space-group)] minimal:block">
              <p className="m-meta mb-5" aria-live="polite">
                {t("resultCount", {
                  shown: filtered.length,
                  total: projectData.length,
                })}
              </p>
              {filtered.length > 0 ? (
                <div className="m-stagger grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
                  {filtered.map((p, i) => (
                    <div key={p.id} className="h-full min-h-0 min-w-0">
                      <ProjectCard entry={p} onOpen={onOpen} index={i + 1} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="m-card m-card-empty px-6 py-12 text-center sm:py-16">
                  <p className="m-eyebrow">{"0 / "}{projectData.length}</p>
                  <p className="m-h3 mt-3">{t("emptyList")}</p>
                  <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">
                    {t("emptyListHint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                    className="m-btn m-btn-ghost mt-6"
                  >
                    {t("clearFilters")}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ProjectModal
        project={activeProject}
        open={activeProject !== null}
        onClose={onClose}
      />
    </Section>
  );
}

/**
 * Modal open state is derived from `?project=` — open/close only mutate the URL.
 * That avoids races where local state and searchParams briefly disagree and the
 * modal immediately re-opens (or closes) after a click.
 */
function ProjectsWithQuery({ projects }: ProjectsProps) {
  const searchParams = useSearchParams();
  const triggerRef = useRef<HTMLElement | null>(null);

  const queryValue = searchParams.get(PROJECT_QUERY_KEY);
  const activeProject = useMemo(() => {
    if (!queryValue) return null;
    return projects.find((p) => projectMatchesQuery(p, queryValue)) ?? null;
  }, [projects, queryValue]);

  const openProject = useCallback(
    (project: ProjectDisplay) => {
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const params = new URLSearchParams(searchParams.toString());
      params.set(PROJECT_QUERY_KEY, projectQueryValue(project));
      replaceQuery(params);
    },
    [searchParams],
  );

  const closeProject = useCallback(() => {
    triggerRef.current?.focus();
    triggerRef.current = null;
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(PROJECT_QUERY_KEY)) return;
    params.delete(PROJECT_QUERY_KEY);
    replaceQuery(params);
  }, [searchParams]);

  return (
    <ProjectsView
      projects={projects}
      activeProject={activeProject}
      onOpen={openProject}
      onClose={closeProject}
    />
  );
}

export function Projects(props: ProjectsProps) {
  return (
    <Suspense
      fallback={
        <ProjectsView
          {...props}
          activeProject={null}
          onOpen={() => {}}
          onClose={() => {}}
        />
      }
    >
      <ProjectsWithQuery {...props} />
    </Suspense>
  );
}
