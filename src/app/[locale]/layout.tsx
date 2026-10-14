import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { RootShell, siteMetadata, siteViewport } from "@/app/root-shell";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport = siteViewport;

/** Defaults only; the description comes from the content, in the page. */
export const metadata: Metadata = siteMetadata;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Root layout of the site: it owns <html>, so `lang` comes from the route
 * param (not from request headers) and the page can be statically generated.
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "tr")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <RootShell lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {/* reducedMotion="user" turns off framer-motion transform/layout animation when the OS asks for less motion. */}
        <MotionConfig reducedMotion="user">
          <ThemeProvider>{children}</ThemeProvider>
        </MotionConfig>
      </NextIntlClientProvider>
    </RootShell>
  );
}
