import type { ReactNode } from "react";

/** Mono label, heading and optional intro used at the top of each section. */
export function SectionHeader({
  label,
  title,
  intro,
  className = "",
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl min-w-0 ${className}`}>
      <p className="decor font-mono text-xs tracking-wide text-accent">
        {label}
      </p>
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight break-words text-foreground sm:text-4xl minimal:mt-0 minimal:text-[1.75rem] minimal:font-normal minimal:tracking-tight minimal:sm:text-3xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>
      )}
    </div>
  );
}
