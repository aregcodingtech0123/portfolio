import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fragment, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SocialSidebar } from "@/components/layout/SocialSidebar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Certificates } from "@/components/sections/Certificates";
import { Skills } from "@/components/sections/Skills";
import { Ctf } from "@/components/sections/Ctf";
import { Experience } from "@/components/sections/Experience";
import { Education } from "@/components/sections/Education";
import { Contact } from "@/components/sections/Contact";
import { SiteContentProvider } from "@/components/providers/SiteContentProvider";
import { getPortfolioContent, type PortfolioContent } from "@/sanity/fetch";
import {
  type SectionId,
  sectionNumbers,
  terminalSectionNumbers,
  visibleSections,
} from "@/config/sections";
import { heroPortraitSrc } from "@/lib/portrait";
import { OWNER_IDENTITY } from "@/lib/seo/identity";
import { buildJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";
import { homeLanguageAlternates, OG_IMAGE, OG_LOCALE, siteUrl, type SiteLocale } from "@/lib/seo/site";
import { routing } from "@/i18n/routing";
import { SectionNumbersProvider } from "@/components/ui/SectionMark";

/**
 * Generated at build time for /en and /tr, then regenerated in the background
 * at most every 10 minutes so Sanity edits appear without a redeploy.
 */
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const siteLocale = locale as SiteLocale;
  const content = await getPortfolioContent(locale);
  const title = `${content.siteName} | ${OWNER_IDENTITY.jobTitle[siteLocale]}`;
  const description = content.seoDescription;
  // One locale-neutral preview image (scripts/og/generate-og-image.ts).
  const image = { url: OG_IMAGE.path, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: title };

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      type: "website",
      url: `/${locale}`,
      siteName: content.siteName,
      title,
      description,
      locale: OG_LOCALE[siteLocale],
      alternateLocale: routing.locales
        .filter((other) => other !== locale)
        .map((other) => OG_LOCALE[other]),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `/${locale}`,
      // The only hreflang source (next-intl's Link header is off).
      languages: homeLanguageAlternates(),
    },
  };
}

/** Terminal skin section labels ("// 03 projects"), finished on the server. */
type SectionLabels = Record<Exclude<SectionId, "home" | "about">, string>;

function renderSection(
  id: SectionId,
  content: PortfolioContent,
  portraitSrc: string | undefined,
  labels: SectionLabels,
): ReactNode {
  switch (id) {
    case "home":
      return <Hero portraitSrc={portraitSrc} />;
    case "about":
      return <About />;
    case "projects":
      return <Projects projects={content.projects} sectionLabel={labels.projects} />;
    case "experience":
      return <Experience items={content.experience} sectionLabel={labels.experience} />;
    case "education":
      return <Education items={content.education} sectionLabel={labels.education} />;
    case "skills":
      return <Skills categories={content.skillCategories} sectionLabel={labels.skills} />;
    case "certificates":
      return (
        <Certificates
          educationCertificates={content.educationCertificates}
          participationCertificates={content.participationCertificates}
          sectionLabel={labels.certificates}
        />
      );
    case "ctf":
      return <Ctf ctfs={content.ctfs} sectionLabel={labels.ctf} />;
    case "contact":
      return <Contact sectionLabel={labels.contact} />;
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await getPortfolioContent(locale);
  const portraitSrc = heroPortraitSrc();
  const visible = visibleSections(content);
  // Simple skin only: "01 / About" numbers follow the config order, over the
  // sections that are actually rendered (home has no header).
  const numbers = sectionNumbers(content);
  // Terminal skin "// 03 projects" labels: same idea, home counted as 01.
  // Numbered over the rendered sections and translated here, on the server:
  // the client receives the finished text and does no numbering work.
  const terminalNumbers = terminalSectionNumbers(content);
  const t = await getTranslations({ locale });
  const n = (id: SectionId) => ({ number: terminalNumbers[id] ?? "" });
  const sectionLabels: SectionLabels = {
    projects: t("Projects.sectionLabel", n("projects")),
    experience: t("Experience.sectionLabel", n("experience")),
    education: t("Education.sectionLabel", n("education")),
    skills: t("Skills.sectionLabel", n("skills")),
    certificates: t("Certificates.sectionLabel", n("certificates")),
    ctf: t("CTF.sectionLabel", n("ctf")),
    contact: t("Contact.sectionLabel", n("contact")),
  };
  // Structured data, built and serialized here in the server component: it
  // is part of the static HTML and adds no client JavaScript.
  const jsonLd = serializeJsonLd(
    buildJsonLd({
      locale: locale as SiteLocale,
      base: siteUrl(),
      content,
      identity: OWNER_IDENTITY,
      portraitSrc,
    }),
  );

  return (
    <SiteContentProvider value={content}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Navbar />
      <SocialSidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative isolate min-w-0 overflow-x-clip focus:outline-none"
      >
        <SectionNumbersProvider numbers={numbers}>
          {visible.map((section) => (
            <Fragment key={section.id}>{renderSection(section.id, content, portraitSrc, sectionLabels)}</Fragment>
          ))}
        </SectionNumbersProvider>
      </main>
      <Footer />
    </SiteContentProvider>
  );
}
