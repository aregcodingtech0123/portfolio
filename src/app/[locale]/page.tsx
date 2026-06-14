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
import { Contact } from "@/components/sections/Contact";
import { SiteContentProvider } from "@/components/providers/SiteContentProvider";
import { getPortfolioContent } from "@/sanity/fetch";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const content = await getPortfolioContent(locale);

  return (
    <SiteContentProvider value={content}>
      <Navbar />
      <SocialSidebar />
      <main className="relative isolate min-w-0 overflow-x-clip">
        <Hero />
        <Certificates
          educationCertificates={content.educationCertificates}
          participationCertificates={content.participationCertificates}
        />
        <About />
        <Projects projects={content.projects} />
        <Skills categories={content.skillCategories} />
        <Ctf ctfs={content.ctfs} />
        <Experience items={content.experience} />
        <Contact />
      </main>
      <Footer />
    </SiteContentProvider>
  );
}
