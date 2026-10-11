"use client";

import { useLocale, useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { FlagGB, FlagTR } from "@/components/ui/flags";
import { NavSelect } from "./NavSelect";

type LocaleCode = (typeof routing.locales)[number];

type LanguageSwitcherProps = {
  showLabel?: boolean;
};

export function LanguageSwitcher({ showLabel = true }: LanguageSwitcherProps) {
  const locale = useLocale() as LocaleCode;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const [pending, startTransition] = useTransition();
  const scrollRestoreY = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (scrollRestoreY.current == null) return;
    const y = scrollRestoreY.current;
    scrollRestoreY.current = null;
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
  }, [locale]);

  function switchTo(next: LocaleCode) {
    if (next === locale) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    scrollRestoreY.current = window.scrollY;
    startTransition(() => {
      router.replace(`${pathname}${hash}`, {
        locale: next,
        scroll: false,
      });
    });
  }

  return (
    <NavSelect
      label={t("toggleLang")}
      value={locale}
      disabled={pending}
      showLabel={showLabel}
      onChange={switchTo}
      options={[
        {
          value: "tr",
          label: t("langTr"),
          icon: <FlagTR title={t("langTrFull")} />,
        },
        {
          value: "en",
          label: t("langEn"),
          icon: <FlagGB title={t("langEnFull")} />,
        },
      ]}
    />
  );
}
