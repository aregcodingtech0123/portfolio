"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import type { CertificateItem } from "@/data/certificates";
import { formatCertificateLine } from "@/data/certificates";

type CertificateCategoryModalProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  items: CertificateItem[];
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
  const cacheRef = useRef<{ title: string; items: CertificateItem[] }>({
    title: "",
    items: [],
  });

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
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="absolute inset-0 bg-scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[101] flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-border/90 bg-surface/95     "
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/80 px-5 py-4  sm:px-6 sm:py-5">
              <h2
                id={titleId}
                className="text-lg font-semibold leading-snug tracking-tight text-foreground  sm:text-xl"
              >
                {displayTitle}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-md border border-border/90 text-muted transition hover:scale-105 hover:border-accent/50 hover:bg-accent/10 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent     "
              >
                <X className="h-5 w-5" aria-hidden strokeWidth={2} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
              <ul className="space-y-0 divide-y divide-border/80 ">
                {displayItems.map((item, index) => (
                  <li
                    key={`${item.name}-${item.issuer}-${index}`}
                    className="py-3 text-sm leading-relaxed text-foreground first:pt-0 last:pb-0  sm:text-[15px]"
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
