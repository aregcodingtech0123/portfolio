"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type NavSelectOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type NavSelectProps<T extends string> = {
  label: string;
  value: T;
  options: NavSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /**
   * Hide the micro-label visually (e.g. compact mobile controls). It stays
   * in the DOM as sr-only, so the accessible name is the same either way.
   */
  showLabel?: boolean;
  /**
   * When `showLabel` is set, reveal the micro-label only from the xl
   * breakpoint up; below it the control is compact (label sr-only). Lets a
   * dense navbar fit narrower desktop widths without dropping the label's
   * accessible name. No effect when `showLabel` is false.
   */
  labelFromXl?: boolean;
  className?: string;
};

/**
 * Labeled navbar combobox: micro-label above a compact trigger + listbox menu.
 */
export function NavSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  showLabel = true,
  labelFromXl = false,
  className = "",
}: NavSelectProps<T>) {
  const listId = useId();
  const labelId = `${listId}-label`;
  const triggerId = `${listId}-trigger`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function commit(next: T) {
    onChange(next);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const index = options.findIndex((option) => option.value === value);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = options[Math.min(index + 1, options.length - 1)];
      if (next) onChange(next.value);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = options[Math.max(index - 1, 0)];
      if (next) onChange(next.value);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  // The label is always in the DOM for the accessible name; `labelFromXl`
  // only changes whether it is painted below the xl breakpoint, and sizes
  // the control to match (compact until then).
  const widthClass = !showLabel
    ? "min-w-0"
    : labelFromXl
      ? "min-w-0 xl:w-[6rem] xl:minimal:w-auto"
      : "w-[5.75rem] xl:w-[6rem]";
  const labelVisual =
    "truncate text-[9px] font-medium tracking-wider text-subtle xl:text-[10px] minimal:font-body minimal:tracking-[0.12em]";
  const labelClass = !showLabel
    ? "sr-only"
    : labelFromXl
      ? "sr-only xl:not-sr-only xl:truncate xl:text-[10px] xl:font-medium xl:tracking-wider xl:text-subtle xl:minimal:font-body xl:minimal:tracking-[0.12em] xl:minimal:sr-only"
      : labelVisual;

  return (
    <div
      ref={rootRef}
      className={`relative flex shrink-0 flex-col items-stretch gap-0.5 ${widthClass} ${className}`.trim()}
    >
      {/* The visible label is the only source of the accessible name, so
          what a speech-input user sees is what they can say (WCAG 2.5.3).
          Sentence case, not CSS uppercase: the label reads as written in
          each locale -- no "SKİN" from uppercasing "Skin" under lang="tr". */}
      <span
        className={labelClass}
        id={labelId}
        title={showLabel ? label : undefined}
      >
        {label}
      </span>

      {/* Label first, then the trigger's own content: the name carries the
          current value too (ARIA APG listbox-button pattern). */}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${triggerId}`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        className={[
          "inline-flex h-8 min-w-0 touch-manipulation items-center justify-between gap-1.5 rounded-sm border border-border bg-surface px-2",
          "font-mono text-[10px] font-medium tracking-wide text-foreground",
          "transition-colors duration-150",
          "hover:border-accent hover:text-accent",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "minimal:h-8 lg:minimal:h-7 minimal:rounded-none minimal:border-border minimal:bg-transparent minimal:font-body minimal:text-xs lg:minimal:text-[11px] minimal:font-normal minimal:normal-case minimal:tracking-normal minimal:text-foreground",
          "minimal:hover:border-foreground minimal:hover:text-foreground",
          "minimal:focus-visible:outline-foreground",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected?.icon}
          <span className="truncate">{selected?.label}</span>
        </span>
        <Chevron open={open} />
      </button>

      <div
        className={[
          "absolute top-[calc(100%+0.25rem)] right-0 z-[60] min-w-full origin-top",
          "transition-[opacity,transform] duration-150 ease-out",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-[0.98] opacity-0",
        ].join(" ")}
      >
        <ul
          id={listId}
          role="listbox"
          tabIndex={open ? 0 : -1}
          aria-labelledby={labelId}
          onKeyDown={onListKeyDown}
          className={[
            "overflow-hidden rounded-sm border border-border bg-surface py-1 shadow-sm",
            "minimal:rounded-none minimal:border-border minimal:bg-background",
          ].join(" ")}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => commit(option.value)}
                  className={[
                    "flex w-full touch-manipulation items-center gap-2 px-2.5 py-1.5 text-left",
                    "font-mono text-[10px] font-medium tracking-wide",
                    "transition-colors duration-150",
                    active
                      ? "bg-accent/15 text-accent minimal:bg-transparent minimal:text-foreground minimal:underline minimal:underline-offset-[0.18em]"
                      : "text-muted hover:bg-border/40 hover:text-foreground minimal:hover:bg-transparent",
                    "minimal:font-body minimal:text-xs minimal:font-normal minimal:normal-case minimal:tracking-normal",
                  ].join(" ")}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 text-muted transition-transform duration-150 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path d="M3 4.5 L6 7.5 L9 4.5" />
    </svg>
  );
}
