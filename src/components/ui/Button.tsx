import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "ghost";

const base =
  "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-sm border px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-on-accent hover:opacity-90",
  ghost:
    "border-border bg-transparent text-foreground hover:border-accent hover:text-accent",
};

/** Class string for button-looking links, e.g. `<Link className={buttonClasses("ghost")}>`. */
export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
