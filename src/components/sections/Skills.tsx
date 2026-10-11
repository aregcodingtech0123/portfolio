"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { SkillCategoryDisplay } from "@/sanity/fetch";
import type { SkillDisplay, SkillTierId } from "@/sanity/types";

type SkillsProps = {
  categories: SkillCategoryDisplay[];
};

/** CLI path segment for known category keys; custom categories use the key as-is. */
const CATEGORY_PATH: Record<string, string> = {
  ai: "ai-ml",
  frontend: "frontend",
  backend: "backend",
  security: "security",
  languages: "languages",
};

const TIER_KEY = {
  expertise: "expertise",
  comfortable: "comfortable",
  learning: "learning",
} as const satisfies Record<SkillTierId, string>;

function SkillTierLabel({
  tier,
  label,
}: {
  tier?: SkillTierId;
  label: string | null;
}) {
  if (!tier || !label) return null;
  return (
    <span className="italic text-foreground"> ({label})</span>
  );
}

/** Terminal: panel styled as `$ cat skills/<path>.txt` output. */
function TerminalSkillPanel({
  categoryId,
  label,
  skills,
  tierLabel,
}: {
  categoryId: string;
  label: string;
  skills: SkillDisplay[];
  tierLabel: (tier?: SkillTierId) => string | null;
}) {
  if (skills.length === 0) return null;

  const path = CATEGORY_PATH[categoryId] ?? categoryId;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-danger" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-sm bg-warning" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-sm bg-accent" aria-hidden />
        <span className="ml-2 truncate font-mono text-[10px] tracking-wide text-muted">
          ~/skills/{path}.txt
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
        <p className="font-mono text-[11px] text-muted">
          <span className="text-accent">$</span>
          {" cat skills/"}
          {path}
          {".txt"}
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-wide text-muted">
          {"# "}
          {label}
        </p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <li key={skill.name}>
              <span
                className={`inline-flex max-w-full items-center rounded-sm border bg-background px-2 py-1 font-mono text-[11px] break-words transition-colors hover:border-accent ${
                  skill.featured
                    ? "border-accent text-accent"
                    : "border-border text-foreground"
                }`}
              >
                <span className="mr-1.5 text-accent" aria-hidden>
                  ›
                </span>
                <span className="font-normal text-foreground">
                  {skill.name}
                </span>
                <SkillTierLabel
                  tier={skill.tier}
                  label={tierLabel(skill.tier)}
                />
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-4 font-mono text-[10px] text-muted">
          <span className="text-accent">{skills.length}</span>
          {" entries listed"}
        </p>
      </div>
    </article>
  );
}

function EssaySkillGroup({
  label,
  skills,
  tierLabel,
}: {
  label: string;
  skills: SkillDisplay[];
  tierLabel: (tier?: SkillTierId) => string | null;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="min-w-0">
      <h3 className="hairline-b border-b border-border pb-2 font-heading text-xl font-normal tracking-tight text-foreground sm:text-2xl">
        {label}
      </h3>
      <dl className="mt-4 space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="flex min-w-0 flex-wrap items-baseline text-base"
          >
            <dt className="font-normal text-foreground no-underline">
              {skill.name}
              <SkillTierLabel
                tier={skill.tier}
                label={tierLabel(skill.tier)}
              />
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Skills({ categories }: SkillsProps) {
  const t = useTranslations("Skills");

  const tierLabel = (tier?: SkillTierId) => {
    if (!tier || !(tier in TIER_KEY)) return null;
    return t(`tiers.${TIER_KEY[tier]}`);
  };

  const categoryLabel = (cat: SkillCategoryDisplay) =>
    cat.label ||
    (cat.id in CATEGORY_PATH ? t(`categories.${cat.id}`) : cat.id);

  return (
    <Section id="skills" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:max-w-content-wide minimal:px-5 sm:minimal:px-6">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 minimal:text-3xl minimal:font-normal">
            {t("subtitle")}
          </h2>
        </div>

        {/* Terminal: CLI catalog panels */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 minimal:hidden">
          {categories.map((cat) => (
            <TerminalSkillPanel
              key={cat.id}
              categoryId={cat.id}
              label={categoryLabel(cat)}
              skills={cat.skills}
              tierLabel={tierLabel}
            />
          ))}
        </div>

        {/* Minimal: two-column definition lists on the wide canvas */}
        <div className="mt-12 hidden grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2 minimal:grid">
          {categories.map((cat) => (
            <EssaySkillGroup
              key={cat.id}
              label={categoryLabel(cat)}
              skills={cat.skills}
              tierLabel={tierLabel}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
