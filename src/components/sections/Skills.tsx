"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { SkillCategoryDisplay } from "@/sanity/fetch";
import type { SkillDisplay, SkillLevel, SkillTierId } from "@/sanity/types";

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
  "programming-languages": "programming-languages",
  databases: "databases",
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

const LEVEL_KEY = {
  daily: "daily",
  "used-in-project": "usedInProject",
  learning: "learning",
} as const satisfies Record<SkillLevel, string>;

/** Simple: a category title and soft tags, with no card chrome or tier dots. */
function SimpleSkillCard({
  label,
  skills,
  tierLabel,
  levelLabel,
  evidenceLabel,
}: {
  label: string;
  skills: SkillDisplay[];
  tierLabel: (tier?: SkillTierId) => string | null;
  levelLabel: (level?: SkillLevel) => string | null;
  evidenceLabel: string;
}) {
  if (skills.length === 0) return null;

  return (
    <article className="m-skill-group">
      <h3 className="m-skill-title">{label}</h3>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((skill) => {
          const tierText = tierLabel(skill.tier);
          const levelText = levelLabel(skill.level);
          // "Learning" as both tier and level would read twice.
          const status = [tierText, levelText !== tierText ? levelText : null]
            .filter(Boolean)
            .join(", ");
          const evidenceText = skill.evidenceTitle
            ? `${evidenceLabel}: ${skill.evidenceTitle}`
            : evidenceLabel;

          return (
            <li key={skill.name} className="m-tag" title={status || undefined}>
              <span className="m-tag-name">{skill.name}</span>
              {status && <span className="sr-only">: {status}</span>}
              {skill.evidenceHref && (
                <a
                  href={skill.evidenceHref}
                  className="m-tag-link"
                  title={evidenceText}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <path d="M3 9 9 3M4.5 3H9v4.5" />
                  </svg>
                  <span className="sr-only">{evidenceText}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function Skills({ categories }: SkillsProps) {
  const t = useTranslations("Skills");

  const tierLabel = (tier?: SkillTierId) => {
    if (!tier || !(tier in TIER_KEY)) return null;
    return t(`tiers.${TIER_KEY[tier]}`);
  };

  const levelLabel = (level?: SkillLevel) => {
    if (!level || !(level in LEVEL_KEY)) return null;
    return t(`levels.${LEVEL_KEY[level]}`);
  };

  const categoryLabel = (cat: SkillCategoryDisplay) =>
    cat.label ||
    (cat.id in CATEGORY_PATH ? t(`categories.${cat.id}`) : cat.id);

  return (
    <Section id="skills" className="py-16 sm:py-24">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 m-container">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl minimal:mt-0 m-h2">
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

        {/* Minimal: open columns, no card chrome. Tier stays in each tag's
            accessible name; the visual dots and legend are omitted. */}
        <div className="hidden min-w-0 minimal:mt-[var(--space-group)] minimal:block">
          <div className="m-stagger grid min-w-0 grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-9 lg:grid-cols-3 lg:gap-x-12">
            {categories.map((cat) => (
              <SimpleSkillCard
                key={cat.id}
                label={categoryLabel(cat)}
                skills={cat.skills}
                tierLabel={tierLabel}
                levelLabel={levelLabel}
                evidenceLabel={t("evidence")}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
