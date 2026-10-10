"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SKINS, type Skin } from "@/lib/theme";

const labelKey = {
  terminal: "skinTerminal",
  minimal: "skinMinimal",
} as const satisfies Record<Skin, string>;

/** Two-option control for the visual skin. Native buttons for keyboard access. */
export function SkinSwitcher() {
  const { skin, setSkin } = useTheme();
  const t = useTranslations("Nav");

  return (
    <div
      className="flex touch-manipulation items-stretch rounded-sm border border-border bg-surface minimal:gap-2 minimal:rounded-none minimal:border-0 minimal:bg-transparent"
      role="group"
      aria-label={t("skinGroup")}
    >
      {SKINS.map((value) => {
        const active = skin === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setSkin(value)}
            aria-pressed={active}
            className={`min-h-8 touch-manipulation px-2 font-mono text-[10px] font-medium tracking-wider uppercase transition-colors duration-150 minimal:min-h-0 minimal:px-0 minimal:py-0.5 minimal:font-body minimal:text-xs minimal:font-normal minimal:normal-case minimal:tracking-normal ${
              active
                ? "bg-accent text-on-accent minimal:bg-transparent minimal:text-foreground minimal:underline minimal:underline-offset-[0.22em]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t(labelKey[value])}
          </button>
        );
      })}
    </div>
  );
}
