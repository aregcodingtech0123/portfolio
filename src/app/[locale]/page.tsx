import { setRequestLocale } from "next-intl/server";
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
import { type SectionId, sectionNumbers, visibleSections } from "@/config/sections";
import { heroPortraitSrc } from "@/lib/portrait";
import { homeLanguageAlternates } from "@/lib/seo/site";
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
  const content = await getPortfolioContent(locale);

  return {
    title: {
      absolute: content.siteName,
    },
    description: content.seoDescription,
    alternates: {
      canonical: `/${locale}`,
      // The only hreflang source (next-intl's Link header is off).
      languages: homeLanguageAlternates(),
    },
  };
}

function renderSection(
  id: SectionId,
  content: PortfolioContent,
  portraitSrc: string | undefined,
): ReactNode {
  switch (id) {
    case "home":
      return <Hero portraitSrc={portraitSrc} />;
    case "about":
      return <About />;
    case "projects":
      return <Projects projects={content.projects} />;
    case "experience":
      return <Experience items={content.experience} />;
    case "education":
      return <Education items={content.education} />;
    case "skills":
      return <Skills categories={content.skillCategories} />;
    case "certificates":
      return (
        <Certificates
          educationCertificates={content.educationCertificates}
          participationCertificates={content.participationCertificates}
        />
      );
    case "ctf":
      return <Ctf ctfs={content.ctfs} />;
    case "contact":
      return <Contact />;
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

  return (
    <SiteContentProvider value={content}>
      <Navbar />
      <SocialSidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative isolate min-w-0 overflow-x-clip focus:outline-none"
      >
        <SectionNumbersProvider numbers={numbers}>
          {visible.map((section) => (
            <Fragment key={section.id}>{renderSection(section.id, content, portraitSrc)}</Fragment>
          ))}
        </SectionNumbersProvider>
      </main>
      <Footer />
    </SiteContentProvider>
  );
}
