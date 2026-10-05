import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buttonClasses } from "@/components/ui/Button";

/** Served for paths outside a locale segment, so it uses the default locale. */
export default async function NotFound() {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "NotFound",
  });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="font-mono text-sm tracking-widest text-accent uppercase">
        404
      </p>
      <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-muted">{t("body")}</p>
      <Link
        href={`/${routing.defaultLocale}`}
        className={`mt-10 ${buttonClasses("primary")}`}
      >
        {t("cta")}
      </Link>
    </div>
  );
}
