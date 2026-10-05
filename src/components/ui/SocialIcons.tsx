"use client";

import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { useSiteContentOptional } from "@/components/providers/SiteContentProvider";

/** Static fallback when SiteContentProvider is unavailable. */
export const socialLinks = {
  github: "https://github.com/aregcodingtech0123",
  linkedin: "https://www.linkedin.com/in/arda-ege-tun%C3%A7-7991312b2/",
};

/** Shared styles for icon-only profile links (hover scale + color). */
export const socialIconLinkClass =
  "inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-md border border-border/70 text-muted outline-none  transition duration-200 ease-out hover:scale-110 hover:border-accent/60 hover:text-accent  active:scale-[0.97]    ";

export const socialIconLinkClassNav =
  "inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-md border border-border/70 text-muted outline-none  transition duration-200 ease-out hover:scale-110 hover:border-accent/60 hover:text-accent  active:scale-[0.97]    ";

export function GitHubIcon({ className = "" }: { className?: string }) {
  return <FaGithub className={className} aria-hidden="true" />;
}

export function LinkedInIcon({ className = "" }: { className?: string }) {
  return <FaLinkedinIn className={className} aria-hidden="true" />;
}

type SocialExternalLinksProps = {
  ariaGithub: string;
  ariaLinkedin: string;
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
};

export function SocialExternalLinks({
  ariaGithub,
  ariaLinkedin,
  className = "flex flex-wrap items-center gap-3",
  iconClassName = "h-4 w-4",
  linkClassName,
}: SocialExternalLinksProps) {
  const content = useSiteContentOptional();
  const githubHref = content?.social.github ?? socialLinks.github;
  const linkedinHref = content?.social.linkedin ?? socialLinks.linkedin;
  const linkBase = linkClassName ?? socialIconLinkClass;
  return (
    <div className={className}>
      <a
        href={githubHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaGithub}
        className={linkBase}
      >
        <GitHubIcon className={iconClassName} />
      </a>
      <a
        href={linkedinHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLinkedin}
        className={linkBase}
      >
        <LinkedInIcon className={iconClassName} />
      </a>
    </div>
  );
}
