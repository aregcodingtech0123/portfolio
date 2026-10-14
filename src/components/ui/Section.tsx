import type { SectionId } from "@/config/sections";
import { SimpleSectionMark } from "@/components/ui/SectionMark";

type Props = {
  id: SectionId;
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
 *
 * The class is always `reveal-rise`. The minimal skin swaps the keyframes to
 * a plain fade in CSS (`[data-skin="minimal"] .reveal-rise`), so the choice
 * does not depend on a client-side skin read and cannot change, and restart
 * the animation, after hydration.
 *
 * Simple skin only: `m-section` sets the gap before the section (a section
 * can pick the minor step with `minimal:[--section-gap:var(--space-section-minor)]`),
 * and the mark draws the rule and "01 / Name" eyebrow in front of the heading.
 */
export function Section({ id, children, className = "" }: Props) {
  return (
    <section
      id={id}
      className={`reveal-rise scroll-mt-28 m-section ${className}`}
    >
      <SimpleSectionMark id={id} />
      {children}
    </section>
  );
}
