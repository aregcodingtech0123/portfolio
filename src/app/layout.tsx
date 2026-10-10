import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Inter,
  JetBrains_Mono,
  Source_Serif_4,
} from "next/font/google";
import { getLocale } from "next-intl/server";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/* Minimal (essay) headings — calm serif display. */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const viewport = {
  width: "device-width" as const,
  initialScale: 1,
  themeColor: "#0A0C0F",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Arda Ege Tunç",
    template: "%s",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${inter.variable} ${sourceSerif.variable} ${jetbrains.variable} min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets data-skin and the dark/light class before first paint. Dev builds also honour ?skin= and ?mode=. */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootScript(process.env.NODE_ENV === "development"),
          }}
        />
      </head>
      <body className="min-h-dvh overflow-x-clip font-body transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
