import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "tr")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* reducedMotion="user" turns off framer-motion transform/layout animation when the OS asks for less motion. */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider>{children}</ThemeProvider>
      </MotionConfig>
    </NextIntlClientProvider>
  );
}
