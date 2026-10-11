"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useIsClient } from "@/lib/useIsClient";
import type { ProjectDisplay } from "@/sanity/fetch";

type ProjectModalProps = {
  project: ProjectDisplay | null;
  open: boolean;
  onClose: () => void;
};

type Highlight = { label: string; body: string };

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ProjectModal({ project, open, onClose }: ProjectModalProps) {
  const t = useTranslations("Projects");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const mounted = useIsClient();
  // Frozen on the last non-null project (React's "adjusting state during
  // rendering" pattern) so exit animations keep rendering its content
  // instead of unmounting the instant `project`/`open` flip to null/false.
  const [display, setDisplay] = useState<ProjectDisplay | null>(null);
  if (project && project !== display) {
    setDisplay(project);
  }

  // Esc closes; Tab/Shift+Tab is trapped to the dialog's own focusable elements.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  const highlights: Highlight[] = display
    ? (
        [
          [t("fieldProblem"), display.problem],
          [t("fieldApproach"), display.approach],
          [t("fieldChallenge"), display.challenge],
          [t("fieldLearned"), display.learned],
        ] as const
      )
        .map(([label, body]) => {
          const text = body?.trim() ?? "";
          return text ? { label, body: text } : null;
        })
        .filter((item): item is Highlight => item !== null)
    : [];

  return createPortal(
    <AnimatePresence>
      {open && display ? (
        <motion.div
          key="project-modal-root"
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6 minimal:items-stretch minimal:p-0 sm:minimal:items-center sm:minimal:p-6"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[101] flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-border bg-surface minimal:h-[100dvh] minimal:max-h-[100dvh] minimal:max-w-none minimal:rounded-none minimal:border-0 minimal:bg-background sm:minimal:h-auto sm:minimal:max-h-[85vh] sm:minimal:max-w-2xl sm:minimal:border sm:minimal:border-border"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }
            }
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="hairline-b flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6 minimal:px-6 minimal:py-5 sm:minimal:px-8 sm:minimal:py-6">
              <h2
                id={titleId}
                className="min-w-0 font-heading text-xl font-semibold tracking-tight break-words text-foreground sm:text-2xl minimal:text-2xl minimal:font-normal sm:minimal:text-3xl"
              >
                {display.title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                aria-label={t("close")}
                className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-sm border border-border text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:px-0 minimal:py-1 minimal:text-sm minimal:underline minimal:decoration-border minimal:underline-offset-4 minimal:hover:border-0 minimal:hover:text-foreground minimal:hover:decoration-foreground"
              >
                <span className="minimal:hidden" aria-hidden>
                  ×
                </span>
                <span className="hidden minimal:inline">{t("close")}</span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="bg-neutral-100/50 p-2 dark:bg-neutral-800/50 minimal:rounded-none sm:rounded-lg">
                <div className="relative mx-auto flex max-h-[50vh] w-full items-center justify-center overflow-hidden">
                  {display.imageUrl ? (
                    <Image
                      src={display.imageUrl}
                      alt={display.imageAlt || display.title}
                      width={1600}
                      height={1000}
                      className="h-auto max-h-[50vh] w-full object-contain object-top"
                      sizes="(max-width: 768px) 100vw, 42rem"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center font-mono text-xs text-muted minimal:font-body">
                      {t("preview")}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6 minimal:space-y-0 minimal:px-6 minimal:py-8 sm:minimal:px-8 sm:minimal:py-10">
                <p className="text-sm leading-relaxed break-words text-muted sm:text-base minimal:pb-8">
                  {display.description}
                </p>

                {highlights.length > 0 && (
                  <>
                    {/* Terminal highlights block */}
                    <div className="minimal:hidden">
                      <p className="font-mono text-[11px] tracking-wider text-accent uppercase">
                        {t("highlights")}
                      </p>
                      <ul className="mt-3 space-y-4">
                        {highlights.map((item) => (
                          <li key={item.label}>
                            <p className="font-mono text-xs font-semibold tracking-wide text-foreground">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed break-words text-muted">
                              {item.body}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Minimal: case-study sections separated by hairlines */}
                    <div className="hidden minimal:block">
                      {highlights.map((item) => (
                        <div
                          key={item.label}
                          className="hairline-t border-t border-border py-6 first:border-t-0 first:pt-0"
                        >
                          <p className="text-xs tracking-[0.06em] text-muted uppercase">
                            {item.label}
                          </p>
                          <p className="mt-2 text-base leading-relaxed break-words text-foreground">
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {display.technologies.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-1.5 minimal:hidden">
                      {display.technologies.map((tech) => (
                        <Tag key={tech}>{tech}</Tag>
                      ))}
                    </div>
                    <p className="hairline-t hidden border-t border-border pt-6 text-sm leading-relaxed text-muted minimal:block">
                      {display.technologies.join(" · ")}
                    </p>
                  </>
                )}
              </div>
            </div>

            <footer className="hairline-t flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-6 minimal:gap-x-6 minimal:gap-y-3 minimal:px-6 minimal:py-5 sm:minimal:px-8">
              {display.liveUrl && (
                <>
                  <a
                    href={display.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClasses("primary", "min-w-[140px] px-5")} minimal:hidden`}
                  >
                    {t("visitSite")}
                  </a>
                  <a
                    href={display.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="essay-link hidden text-base text-foreground minimal:inline"
                  >
                    {t("visitSite")}
                  </a>
                </>
              )}
              {display.githubUrl && (
                <>
                  <a
                    href={display.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${buttonClasses("ghost", "min-w-[120px] px-5")} minimal:hidden`}
                  >
                    {t("github")}
                  </a>
                  <a
                    href={display.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="essay-link hidden text-base text-foreground minimal:inline"
                  >
                    {t("github")}
                  </a>
                </>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className={`${buttonClasses("ghost", "ml-auto min-w-[100px] px-5")} minimal:hidden`}
              >
                {t("close")}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
