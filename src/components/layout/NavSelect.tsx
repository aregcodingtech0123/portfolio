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
  /** Accessible name for the trigger (defaults to `label`). */
  ariaLabel?: string;
  disabled?: boolean;
  /** Hide the micro-label (e.g. compact mobile controls). */
  showLabel?: boolean;
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
  ariaLabel,
  disabled = false,
  showLabel = true,
  className = "",
}: NavSelectProps<T>) {
  const listId = useId();
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

  return (
    <div
      ref={rootRef}
      className={`relative flex shrink-0 flex-col items-stretch gap-0.5 ${
        showLabel ? "w-[7.25rem] xl:w-[7.75rem]" : "min-w-0"
      } ${className}`.trim()}
    >
      {showLabel ? (
        <span
          className="truncate text-[9px] font-medium uppercase tracking-wider text-muted/80 xl:text-[10px] minimal:font-body minimal:tracking-[0.12em]"
          id={`${listId}-label`}
          title={label}
        >
          {label}
        </span>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={showLabel ? `${listId}-label` : undefined}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        className={[
          "inline-flex h-8 min-w-0 touch-manipulation items-center justify-between gap-1.5 rounded-sm border border-border bg-surface px-2",
          "font-mono text-[10px] font-medium tracking-wide text-foreground uppercase",
          "transition-colors duration-150",
          "hover:border-accent hover:text-accent",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "minimal:h-8 minimal:rounded-none minimal:border-border minimal:bg-transparent minimal:font-body minimal:text-xs minimal:font-normal minimal:normal-case minimal:tracking-normal minimal:text-foreground",
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
          aria-label={ariaLabel ?? label}
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
                    "font-mono text-[10px] font-medium tracking-wide uppercase",
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
