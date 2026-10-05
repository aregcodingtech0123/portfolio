import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
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
  description:
    "Computer Engineer specializing in Generative AI, full-stack development, and cybersecurity. Based in Ankara, Turkey.",
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
      className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable} min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';d.classList.remove('light','dark');d.classList.add(t);d.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh overflow-x-clip font-body transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
