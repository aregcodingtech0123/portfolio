"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { sections, type SectionId, type SectionNumbers } from "@/config/sections";

/**
 * Section numbers for the Simple skin header ("01 / About").
 *
 * The page derives them from the order of `config/sections.ts`
 * (`sectionNumbers`) and hands them down through this context. Without a
 * provider the map is empty and no mark is drawn, which is what a component
 * test that renders a single section wants.
 */
const SectionNumbersContext = createContext<SectionNumbers>({});

export function SectionNumbersProvider({
  numbers,
  children,
}: {
  numbers: SectionNumbers;
  children: ReactNode;
}) {
  return (
    <SectionNumbersContext.Provider value={numbers}>
      {children}
    </SectionNumbersContext.Provider>
  );
}

/**
 * Simple-skin header mark: a 2px rule at full contrast and a mono eyebrow with
 * the section number and name. It is rendered in every skin but only displayed
 * under data-skin="minimal" (the terminal skin keeps its own `// 03 projects`
 * eyebrow). aria-hidden: the heading right below it is the section's name.
 */
export function SimpleSectionMark({ id }: { id: SectionId }) {
  const t = useTranslations("Nav");
  const numbers = useContext(SectionNumbersContext);
  const number = numbers[id];
  const config = sections.find((section) => section.id === id);
  if (!number || !config) return null;

  return (
    <div
      className="m-section-mark-wrap m-container hidden minimal:block minimal:pb-[var(--space-header)]"
      aria-hidden="true"
    >
      <div className="m-section-mark">
        <p className="m-eyebrow">{`${number} / ${t(config.navKey)}`}</p>
      </div>
    </div>
  );
}
