"use client";

import { useTranslations } from "next-intl";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/SocialIcons";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function SocialSidebar() {
  const t = useTranslations("Social");
  const { social } = useSiteContent();

  const items = [
    {
      id: "github" as const,
      href: social.github,
      Icon: GitHubIcon,
      labelKey: "github" as const,
      ariaKey: "githubAria" as const,
    },
    {
      id: "linkedin" as const,
      href: social.linkedin,
      Icon: LinkedInIcon,
      labelKey: "linkedin" as const,
      ariaKey: "linkedinAria" as const,
    },
  ];

  return (
    <aside className="fixed right-3 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex">
      {items.map(({ id, href, Icon, labelKey, ariaKey }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(ariaKey)}
          className="group flex touch-manipulation items-center justify-end"
        >
          <span className="mr-2 max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold tracking-wide text-slate-300 opacity-0 transition-all duration-300 group-hover:max-w-24 group-hover:opacity-100">
            {t(labelKey)}
          </span>
          <span className="glass-panel inline-flex h-10 w-10 translate-x-0 items-center justify-center rounded-xl text-slate-400 transition duration-200 ease-out group-hover:-translate-x-1 group-hover:scale-110 group-hover:text-sky-300 group-hover:shadow-[0_0_24px_rgba(56,189,248,0.35)]">
            <Icon className="h-5 w-5" />
          </span>
        </a>
      ))}
    </aside>
  );
}
