"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import type { CertificateDisplay } from "@/sanity/fetch";

function formatCertificateLine(item: CertificateDisplay): string {
  const base = `${item.title} - ${item.issuer}`;
  return item.date ? `${base} (${item.date})` : base;
}

type CertificateCategoryModalProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  items: CertificateDisplay[];
  onClose: () => void;
};

export function CertificateCategoryModal({
  open,
  title,
  closeLabel,
  items,
  onClose,
}: CertificateCategoryModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const cacheRef = useRef<{ title: string; items: CertificateDisplay[] }>({
    title: "",
    items: [],
  });
  const reduceMotion = useReducedMotion();

  if (open && title && items.length > 0) {
    cacheRef.current = { title, items };
  }

  const displayTitle = cacheRef.current.title;
  const displayItems = cacheRef.current.items;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="certificate-modal-root"
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
        >
          <motion.div
            className="absolute inset-0 bg-scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[101] flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-border/90 bg-surface/95 minimal:max-w-content minimal:rounded-none minimal:border-0 minimal:bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="hairline-b flex shrink-0 items-start justify-between gap-3 border-b border-border/80 px-5 py-4 sm:px-6 sm:py-5 minimal:border-border">
              <h2
                id={titleId}
                className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl minimal:font-heading minimal:font-normal"
              >
                {displayTitle}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-md border border-border/90 text-muted transition hover:border-accent/50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:px-0 minimal:py-1 minimal:text-sm minimal:underline minimal:underline-offset-4 minimal:decoration-border minimal:hover:border-0"
              >
                <span className="minimal:hidden" aria-hidden>
                  ×
                </span>
                <span className="hidden minimal:inline">{closeLabel}</span>
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
              <ul className="space-y-0 divide-y divide-border/80 minimal:divide-y-0">
                {displayItems.map((item, index) => (
                  <li
                    key={`${item.title}-${item.issuer}-${index}`}
                    className="py-3 text-sm leading-relaxed text-foreground first:pt-0 last:pb-0 sm:text-[15px] minimal:py-2.5"
                  >
                    <span className="block break-words">
                      {formatCertificateLine(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
