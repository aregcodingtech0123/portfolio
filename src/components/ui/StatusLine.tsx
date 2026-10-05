import type { ReactNode } from "react";

export type StatusKind = "ok" | "live" | "blocked" | "pending";

const tone: Record<StatusKind, string> = {
  ok: "text-accent",
  live: "text-accent",
  blocked: "text-danger",
  pending: "text-warning",
};

/** Terminal-style status text, e.g. `[OK] deployed` or `[BLOCKED] access denied`. */
export function StatusLine({
  status,
  label,
  children,
  className = "",
}: {
  status: StatusKind;
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <p className={`font-mono text-xs tracking-wide uppercase ${className}`}>
      <span className={tone[status]}>[{label ?? status.toUpperCase()}]</span>
      {children && <span className="ml-2 normal-case text-muted">{children}</span>}
    </p>
  );
}
