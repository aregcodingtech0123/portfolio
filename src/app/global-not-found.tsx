import type { Metadata } from "next";
import { RootShell } from "@/app/root-shell";
import { buttonClasses } from "@/components/ui/Button";
import { routing } from "@/i18n/routing";
import messages from "../../messages/en.json";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

/**
 * Served for any URL that matches no route (see experimental.globalNotFound in
 * next.config.ts). The site has no layout above [locale], so Next cannot
 * compose a 404 from one; this renders its own document, in the default
 * locale, and is generated at build time.
 */
export default function GlobalNotFound() {
  const t = messages.NotFound;
  return (
    <RootShell lang={routing.defaultLocale}>
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <p className="font-mono text-sm tracking-widest text-accent uppercase">404</p>
        <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">{t.title}</h1>
        <p className="mt-3 max-w-md text-muted">{t.body}</p>
        <a href={`/${routing.defaultLocale}`} className={`mt-10 ${buttonClasses("primary")}`}>
          {t.cta}
        </a>
      </div>
    </RootShell>
  );
}
