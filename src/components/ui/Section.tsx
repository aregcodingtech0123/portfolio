"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

type Props = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Section wrapper with a scroll-reveal entrance.
 *
 * The reveal is pure CSS (see globals.css): the section ships visible and
 * is only hidden-then-revealed for motion-OK browsers that support
 * scroll-driven animation. Reduced motion, no/slow/failed JS, and older
 * browsers all render the section fully visible with no script. This
 * replaced a Framer `whileInView` reveal whose server-rendered opacity: 0
 * left the whole page blank under reduced motion or before hydration.
 */
export function Section({ id, children, className = "" }: Props) {
  const { skin } = useTheme();
  // Terminal rises in; the minimal "essay" skin only fades.
  const reveal = skin === "minimal" ? "reveal-fade" : "reveal-rise";

  return (
    <section
      id={id}
      className={`${reveal} scroll-mt-28 minimal:py-[var(--rhythm-half)] ${className}`}
    >
      {children}
    </section>
  );
}
