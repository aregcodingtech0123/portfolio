"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Tag } from "@/components/ui/Tag";
import { buttonClasses } from "@/components/ui/Button";
import type { ProjectDisplay } from "@/sanity/fetch";
import type { ProjectCategory } from "@/sanity/types";

const categoryKey = {
  ai: "filterAi",
  fullstack: "filterFullstack",
  security: "filterSecurity",
  tooling: "filterTooling",
} as const satisfies Record<ProjectCategory, string>;

type ProjectCardProps = {
  entry: ProjectDisplay;
  onOpen: (project: ProjectDisplay) => void;
};

export function ProjectCard({ entry, onOpen }: ProjectCardProps) {
  const t = useTranslations("Projects");
  const categoryLabel = t(categoryKey[entry.category]);
  const hasLive = Boolean(entry.liveUrl);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors duration-300 ease-in-out hover:border-accent focus-within:border-accent">
      {/* Full-card hit target for the modal (does not cover the Live CTA). */}
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="absolute inset-0 z-0 cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`${t("openDetails")}: ${entry.title}`}
      />

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-background">
          {entry.imageUrl ? (
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt || entry.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-wider text-muted lowercase">
              {t("preview")}
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-sm border border-border bg-surface/95 px-2 py-1 font-mono text-[10px] tracking-wide text-foreground uppercase">
            {categoryLabel}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-semibold tracking-tight break-words text-foreground">
              {entry.title}
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

          <div className="mt-auto pt-1">
            {hasLive ? (
              <a
                href={entry.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`pointer-events-auto relative z-20 ${buttonClasses("primary", "w-full px-3 py-2 text-xs")}`}
              >
                {t("liveCta")}
              </a>
            ) : (
              <span className="inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-border px-3 py-2 font-mono text-xs tracking-wide text-muted uppercase">
                {t("noLive")}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
