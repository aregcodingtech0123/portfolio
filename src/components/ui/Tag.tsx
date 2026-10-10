import type { ReactNode } from "react";

/** Rectangular, monospace label for technologies, skills and tools. */
export function Tag({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-sm border border-border bg-tag px-2 py-0.5 font-code text-xs break-words text-tag-foreground ${className}`}
    >
      {children}
    </span>
  );
}
