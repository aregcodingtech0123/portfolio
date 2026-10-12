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
import { type SectionId, visibleSections } from "@/config/sections";
import { resolvePortraitSrc } from "@/lib/portrait";

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
      languages: {
        en: "/en",
        tr: "/tr",
      },
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
  const content = await getPortfolioContent(locale);
  const portraitSrc = resolvePortraitSrc();

  return (
    <SiteContentProvider value={content}>
      <Navbar />
      <SocialSidebar />
      <main className="relative isolate min-w-0 overflow-x-clip">
        {visibleSections(content).map((section) => (
          <Fragment key={section.id}>{renderSection(section.id, content, portraitSrc)}</Fragment>
        ))}
      </main>
      <Footer />
    </SiteContentProvider>
  );
}
