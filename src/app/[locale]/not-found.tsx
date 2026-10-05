import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonClasses } from "@/components/ui/Button";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="font-mono text-sm tracking-widest text-accent uppercase">
        404
      </p>
      <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-muted">{t("body")}</p>
      <Link href={`/${locale}`} className={`mt-10 ${buttonClasses("primary")}`}>
        {t("cta")}
      </Link>
    </div>
  );
}
