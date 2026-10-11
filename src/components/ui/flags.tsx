type FlagProps = {
  className?: string;
  title?: string;
};

/** Crisp Turkish flag for ~18×12 navbar selects. */
export function FlagTR({ className = "h-3 w-[18px]", title }: FlagProps) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={`shrink-0 overflow-hidden rounded-[1px] ${className}`.trim()}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="18" height="12" fill="#E30A17" />
      <circle cx="7.15" cy="6" r="3.2" fill="#fff" />
      <circle cx="8.05" cy="6" r="2.55" fill="#E30A17" />
      <path
        fill="#fff"
        d="M11.05 6l-1.08.35.62-.95-.62-.95 1.08.35.35-1.08.35 1.08 1.08-.35-.62.95.62.95-1.08-.35-.35 1.08z"
      />
    </svg>
  );
}

/** Crisp United Kingdom flag for ~18×12 navbar selects. */
export function FlagGB({ className = "h-3 w-[18px]", title }: FlagProps) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={`shrink-0 overflow-hidden rounded-[1px] ${className}`.trim()}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="18" height="12" fill="#012169" />
      <path d="M0 0 L18 12 M18 0 L0 12" stroke="#fff" strokeWidth="2.2" />
      <path d="M0 0 L18 12 M18 0 L0 12" stroke="#C8102E" strokeWidth="1.15" />
      <path d="M9 0 V12 M0 6 H18" stroke="#fff" strokeWidth="3.6" />
      <path d="M9 0 V12 M0 6 H18" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}
