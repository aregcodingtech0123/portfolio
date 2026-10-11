"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SKINS, type Skin } from "@/lib/theme";
import { NavSelect } from "./NavSelect";

const labelKey = {
  terminal: "skinTerminal",
  minimal: "skinMinimal",
} as const satisfies Record<Skin, string>;

type SkinSwitcherProps = {
  showLabel?: boolean;
};

export function SkinSwitcher({ showLabel = true }: SkinSwitcherProps) {
  const { skin, setSkin } = useTheme();
  const t = useTranslations("Nav");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const value: Skin =
    mounted && skin === "minimal" ? "minimal" : "terminal";

  return (
    <NavSelect
      label={t("toggleStyle")}
      ariaLabel={t("skinGroup")}
      value={value}
      disabled={!mounted}
      showLabel={showLabel}
      onChange={setSkin}
      options={SKINS.map((option) => ({
        value: option,
        label: t(labelKey[option]),
      }))}
    />
  );
}
