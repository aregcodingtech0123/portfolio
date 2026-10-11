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
    <footer className="relative overflow-hidden border-t border-border bg-surface py-14 minimal:hairline-t minimal:border-border minimal:bg-transparent minimal:py-16">
      <div className="relative z-10 mx-auto grid min-w-0 max-w-content gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8 minimal:max-w-content-wide minimal:gap-8 minimal:px-5 sm:minimal:px-6">
        <div className="lg:col-span-1">
          <p className="font-semibold tracking-tight text-foreground minimal:font-heading minimal:text-xl minimal:font-normal minimal:tracking-tight">
            {siteName}
          </p>
          <p className="mt-2 max-w-xs text-left text-sm leading-relaxed text-muted">
            {t("builtWith")}
          </p>
        </div>
        <div className="lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted minimal:text-sm minimal:font-normal minimal:normal-case minimal:tracking-normal">
            {t("quick")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 minimal:flex-col minimal:gap-y-2">
            {links.map(({ id, key }) => (
              <li key={id}>
                <Link
                  href={`/#${id}`}
                  className="text-sm text-muted transition hover:text-accent minimal:essay-link minimal:text-foreground"
                >
                  {n(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4 lg:items-end minimal:items-start">
          <div className="text-left lg:text-right minimal:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted minimal:text-sm minimal:font-normal minimal:normal-case minimal:tracking-normal">
              {t("connect")}
            </p>
            <SocialExternalLinks
              ariaGithub={s("githubAria")}
              ariaLinkedin={s("linkedinAria")}
              className="mt-3 flex items-center gap-3 lg:justify-end minimal:justify-start"
              iconClassName="h-4 w-4"
              linkClassName={`${socialIconLinkClassNav} minimal:h-auto minimal:w-auto minimal:rounded-none minimal:border-0 minimal:p-0 minimal:text-muted minimal:hover:border-0 minimal:hover:text-foreground`}
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
