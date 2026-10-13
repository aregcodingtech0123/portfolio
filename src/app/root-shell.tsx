import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Inter,
  JetBrains_Mono,
  Source_Serif_4,
} from "next/font/google";
import { siteUrl } from "@/lib/seo/site";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

/*
 * Shared document shell. There is deliberately no app/layout.tsx: the site
 * (app/[locale]/layout.tsx) and the Studio (app/content-hub/.../layout.tsx)
 * are separate root layouts that each render this shell. A single root layout
 * above [locale] cannot know the locale without reading request headers, which
 * forces every page below it to render per request. With the <html> element
 * owned by [locale]/layout.tsx, the locale comes from the route param and the
 * page can be generated at build time and revalidated.
 */

/*
 * Font preloading. The active skin comes from localStorage via the boot
 * script, so the server cannot know which skin's fonts a visitor needs, and
 * preloading every family sent each visitor the other skin's fonts for
 * nothing (about 93 KB for terminal, 116 KB for minimal). Only Inter, which
 * both skins use for body text, is preloaded. The skin-specific families keep
 * their @font-face rules and display: "swap", so the browser fetches one when
 * the active skin's CSS first uses it (a runtime skin switch fetches the other
 * skin's family then), with text visible in the metric-matched fallback until
 * it arrives.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
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
  preload: false,
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});

export const siteViewport = {
  width: "device-width" as const,
  initialScale: 1,
  themeColor: "#0A0C0F",
};

/**
 * Site-wide defaults. Per-locale title, description, alternates, Open Graph
 * and Twitter metadata come from the page (app/[locale]/page.tsx), which
 * knows the locale and the content.
 */
export const siteMetadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Arda Ege Tunç",
    template: "%s",
  },
  robots: { index: true, follow: true },
};

export function RootShell({
  lang,
  children,
}: Readonly<{
  lang: string;
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={lang}
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
