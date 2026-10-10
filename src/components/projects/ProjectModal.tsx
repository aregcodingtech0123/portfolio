"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
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
  const [mounted, setMounted] = useState(false);
  // Frozen on the last non-null project (React's "adjusting state during
  // rendering" pattern) so exit animations keep rendering its content
  // instead of unmounting the instant `project`/`open` flip to null/false.
  const [display, setDisplay] = useState<ProjectDisplay | null>(null);
  if (project && project !== display) {
    setDisplay(project);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

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
          display.problem
            ? { label: t("fieldProblem"), body: display.problem }
            : null,
          display.approach
            ? { label: t("fieldApproach"), body: display.approach }
            : null,
          display.challenge
            ? { label: t("fieldChallenge"), body: display.challenge }
            : null,
          display.learned
            ? { label: t("fieldLearned"), body: display.learned }
            : null,
        ] as const
      ).filter((item): item is Highlight => item !== null)
    : [];

  return createPortal(
    <AnimatePresence>
      {open && display ? (
        <motion.div
          key="project-modal-root"
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
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
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[101] flex max-h-[min(90vh,800px)] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-border bg-surface"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }
            }
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="hairline-b flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <h2
                id={titleId}
                className="min-w-0 font-heading text-xl font-semibold tracking-tight break-words text-foreground sm:text-2xl minimal:font-normal"
              >
                {display.title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-sm border border-border text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent minimal:hover:border-foreground minimal:hover:text-foreground"
              >
                <span aria-hidden className="text-lg leading-none">
                  ×
                </span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="relative aspect-[16/10] w-full bg-background">
                {display.imageUrl ? (
                  <Image
                    src={display.imageUrl}
                    alt={display.imageAlt || display.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 42rem"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
                    {t("preview")}
                  </div>
                )}
              </div>

              <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-sm leading-relaxed break-words text-muted sm:text-base">
                  {display.description}
                </p>

                {highlights.length > 0 && (
                  <div>
                    <p className="font-mono text-[11px] tracking-wider text-accent uppercase minimal:text-muted">
                      {t("highlights")}
                    </p>
                    <ul className="mt-3 space-y-4">
                      {highlights.map((item) => (
                        <li key={item.label}>
                          <p className="font-mono text-xs font-semibold tracking-wide text-foreground minimal:font-body minimal:font-medium">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed break-words text-muted">
                            {item.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {display.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {display.technologies.map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <footer className="hairline-t flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-6">
              {display.liveUrl && (
                <a
                  href={display.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("primary", "min-w-[140px] px-5")}
                >
                  {t("visitSite")}
                </a>
              )}
              {display.githubUrl && (
                <a
                  href={display.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("ghost", "min-w-[120px] px-5")}
                >
                  {t("github")}
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className={buttonClasses("ghost", "ml-auto min-w-[100px] px-5")}
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
