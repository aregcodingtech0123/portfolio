"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tag } from "@/components/ui/Tag";
import type { ProjectDisplay } from "@/sanity/fetch";
import type { ProjectCategory } from "@/sanity/types";

const categoryKey = {
  ai: "filterAi",
  fullstack: "filterFullstack",
  security: "filterSecurity",
  tooling: "filterTooling",
} as const satisfies Record<ProjectCategory, string>;

const PREVIEW_FRAME =
  "relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-neutral-100 dark:bg-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent";

const PREVIEW_IMAGE =
  "object-contain object-top";

type ProjectCardProps = {
  entry: ProjectDisplay;
  onOpen: (project: ProjectDisplay) => void;
};

/**
 * Terminal + Minimal cards share the same interaction model:
 * title (and image) open the details modal; the Live link opens externally only.
 */
export function ProjectCard({ entry, onOpen }: ProjectCardProps) {
  const t = useTranslations("Projects");
  const categoryLabel = t(categoryKey[entry.category]);
  const hasLive = Boolean(entry.liveUrl);
  const techs = entry.technologies.slice(0, 3);

  const openDetails = () => onOpen(entry);

  const renderLiveLink = () =>
    hasLive ? (
      <a
        href={entry.liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`${t("demo")}: ${entry.title}`}
        className="group/live relative z-20 inline-flex min-h-10 touch-manipulation items-center gap-1.5 font-mono text-xs tracking-wide text-muted uppercase transition-colors duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent minimal:min-h-0 minimal:font-body minimal:text-sm minimal:normal-case minimal:tracking-normal minimal:text-muted minimal:hover:text-foreground"
      >
        <span aria-hidden>{t("demo")}</span>
        <ExternalLink
          aria-hidden
          className="size-3.5 shrink-0 opacity-70 transition-opacity duration-200 group-hover/live:opacity-100"
          strokeWidth={1.75}
        />
      </a>
    ) : (
      <span className="inline-flex min-h-10 items-center font-mono text-xs tracking-wide text-subtle uppercase minimal:min-h-0 minimal:font-body minimal:text-sm minimal:normal-case minimal:tracking-normal">
        {t("noLive")}
      </span>
    );

  return (
    <>
      {/* Terminal card */}
      <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors duration-300 ease-in-out hover:border-accent focus-within:border-accent minimal:hidden">
        <button
          type="button"
          onClick={openDetails}
          aria-label={`${t("openDetails")}: ${entry.title}`}
          className={PREVIEW_FRAME}
        >
          {entry.imageUrl ? (
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt || entry.title}
              fill
              className={PREVIEW_IMAGE}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-wider text-muted">
              {t("preview")}
            </span>
          )}
          <span className="pointer-events-none absolute top-3 left-3 rounded-sm border border-border bg-surface/95 px-2 py-1 font-mono text-[10px] tracking-wide text-foreground uppercase">
            {categoryLabel}
          </span>
        </button>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="min-w-0">
              <button
                type="button"
                onClick={openDetails}
                className="cursor-pointer text-left font-heading text-lg font-semibold tracking-tight break-words text-foreground underline-offset-[0.18em] transition-[color,text-decoration-color,opacity] duration-200 hover:text-accent hover:underline hover:decoration-accent/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {entry.title}
              </button>
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
              {entry.description}
            </p>
          </div>

          {entry.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.technologies.slice(0, 4).map((tech) => (
                <Tag key={tech} className="text-[10px]">
                  {tech}
                </Tag>
              ))}
              {entry.technologies.length > 4 && (
                <span className="font-mono text-[10px] text-muted">
                  +{entry.technologies.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center pt-1">{renderLiveLink()}</div>
        </div>
      </article>

      {/* Minimal card */}
      <article className="group relative hidden h-full w-full flex-col border border-border bg-transparent transition-[border-color] duration-200 hover:border-foreground minimal:flex">
        <button
          type="button"
          onClick={openDetails}
          aria-label={`${t("openDetails")}: ${entry.title}`}
          className={PREVIEW_FRAME}
        >
          {entry.imageUrl ? (
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt || entry.title}
              fill
              className={PREVIEW_IMAGE}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">
              {t("preview")}
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-5">
          <h3 className="min-w-0">
            <button
              type="button"
              onClick={openDetails}
              className="cursor-pointer text-left font-heading text-lg font-normal tracking-tight break-words text-foreground underline-offset-[0.22em] transition-[color,text-decoration-color,opacity] duration-200 hover:underline hover:decoration-foreground/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-xl"
            >
              {entry.title}
            </button>
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {entry.description}
          </p>
          {techs.length > 0 && (
            <p className="pt-1 text-xs leading-relaxed text-muted">
              {techs.join(" · ")}
            </p>
          )}
          <div className="mt-auto flex items-center pt-3">{renderLiveLink()}</div>
        </div>
      </article>
    </>
  );
}
