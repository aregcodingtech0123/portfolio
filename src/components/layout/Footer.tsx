"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  SocialExternalLinks,
  socialIconLinkClassNav,
} from "@/components/ui/SocialIcons";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { visibleSections } from "@/config/sections";


export function Footer() {
  const t = useTranslations("Footer");
  const s = useTranslations("Social");
  const n = useTranslations("Nav");
  const content = useSiteContent();
  const { siteName } = content;
  const links = visibleSections(content)
    .filter((s) => s.inFooter)
    .map((s) => ({ id: s.id, key: s.navKey }));
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface py-14">
      <div className="relative z-10 mx-auto grid min-w-0 max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-1">
          <p className="font-semibold tracking-tight text-foreground ">
            {siteName}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted ">
            {t("builtWith")}
          </p>
        </div>
        <div className="lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t("quick")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {links.map(({ id, key }) => (
              <li key={id}>
                <Link
                  href={`/#${id}`}
                  className="text-sm text-muted transition hover:text-accent  "
                >
                  {n(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4 lg:items-end">
          <div className="text-left lg:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
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
          <p className="text-xs text-muted">
            © {year} {siteName}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
