"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { Mode } from "@/lib/theme";
import { NavSelect } from "./NavSelect";

type ThemeToggleProps = {
  showLabel?: boolean;
};

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Nav");

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const value: Mode = mounted && mode === "light" ? "light" : "dark";

  return (
    <NavSelect
      label={t("mode")}
      value={value}
      disabled={!mounted}
      showLabel={showLabel}
      onChange={setMode}
      options={[
        { value: "dark", label: t("themeOptionDark") },
        { value: "light", label: t("themeOptionLight") },
      ]}
    />
  );
}
