import type { ReactNode } from "react";

export type StatusKind = "ok" | "live" | "blocked" | "pending" | "archived";

const tone: Record<StatusKind, string> = {
  ok: "text-accent",
  live: "text-accent",
  blocked: "text-danger",
  pending: "text-warning",
  archived: "text-muted",
};

/**
 * Terminal: `[OK] deployed`, with the bracketed label in caps.
 * Minimal: the plain `plain` word, e.g. "Live" or "Yayında", with no brackets or caps.
 */
export function StatusLine({
  status,
  label,
  plain,
  children,
  className = "",
}: {
  status: StatusKind;
  /** Terminal bracket text, e.g. "LIVE". */
  label?: string;
  /** Minimal plain word, localized by the caller. Falls back to the terminal label. */
  plain?: string;
  children?: ReactNode;
  className?: string;
}) {
  const terminalLabel = label ?? status.toUpperCase();
  return (
    <p
      className={`font-mono text-xs tracking-wide uppercase minimal:normal-case minimal:tracking-normal ${className}`}
    >
      <span className={tone[status]}>
        <span className="decor">[{terminalLabel}]</span>
        <span className="hidden minimal:inline">{plain ?? terminalLabel}</span>
      </span>
      {children && <span className="ml-2 normal-case text-muted">{children}</span>}
    </p>
  );
}
