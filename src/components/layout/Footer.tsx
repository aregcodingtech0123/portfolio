"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  SocialExternalLinks,
  socialIconLinkClassNav,
} from "@/components/ui/SocialIcons";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const links = [
  { id: "home", key: "home" as const },
  { id: "about", key: "about" as const },
  { id: "projects", key: "projects" as const },
  { id: "skills", key: "skills" as const },
  { id: "contact", key: "contact" as const },
];

export function Footer() {
  const t = useTranslations("Footer");
  const s = useTranslations("Social");
  const n = useTranslations("Nav");
  const { siteName } = useSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-200/90 bg-white/75 py-14 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40 dark:opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent dark:via-sky-500/40" />
      <div className="relative z-10 mx-auto grid min-w-0 max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-1">
          <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {siteName}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t("builtWith")}
          </p>
        </div>
        <div className="lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            {t("quick")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {links.map(({ id, key }) => (
              <li key={id}>
                <Link
                  href={`/#${id}`}
                  className="text-sm text-slate-600 transition hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300"
                >
                  {n(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4 lg:items-end">
          <div className="text-left lg:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {t("connect")}
            </p>
            <SocialExternalLinks
              ariaGithub={s("githubAria")}
              ariaLinkedin={s("linkedinAria")}
              className="mt-3 flex items-center gap-3 lg:justify-end"
              iconClassName="h-4 w-4"
              linkClassName={socialIconLinkClassNav}
            />
          </div>
          <LanguageSwitcher />
          <p className="text-xs text-slate-500">
            © {year} {siteName}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
