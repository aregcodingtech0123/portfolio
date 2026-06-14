/**
 * Single source of truth for portfolio structured content.
 * Used by: Sanity seed script, static fallbacks, and migration reference.
 */
import type { LocaleField } from "@/sanity/types";
import type { CertificateItem } from "@/data/certificates";
import type { ProjectCategory } from "@/data/projects";
import type { SkillCategoryId, SkillTierGroup } from "@/data/skills";

export type MigrationProject = {
  id: string;
  title: LocaleField;
  description: LocaleField;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  order: number;
  featured: boolean;
};

export type MigrationExperience = {
  id: string;
  company: LocaleField;
  role: LocaleField;
  period: LocaleField;
  detail: LocaleField;
  order: number;
};

export type MigrationSkillCategory = {
  id: SkillCategoryId;
  label: LocaleField;
  groups: SkillTierGroup[];
  order: number;
};

export type MigrationSiteSettings = {
  siteName: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  location: LocaleField;
  hero: {
    greeting: LocaleField;
    name: LocaleField;
    rolePrefix: LocaleField;
    ctaProjects: LocaleField;
    ctaContact: LocaleField;
    badges: {
      ai: LocaleField;
      fullstack: LocaleField;
      security: LocaleField;
    };
    typingRoles: LocaleField[];
    profileTagline: LocaleField;
  };
  about: {
    summary: LocaleField;
    edu1: LocaleField;
    edu2: LocaleField;
    experienced: LocaleField;
    stats: {
      focus: LocaleField;
      focusValue: LocaleField;
      stack: LocaleField;
      stackValue: LocaleField;
      mindset: LocaleField;
      mindsetValue: LocaleField;
    };
  };
  aboutHighlights: { text: LocaleField }[];
  seo: {
    homeDescription: LocaleField;
  };
};

export const migrationPortfolio = {
  siteSettings: {
    siteName: "Arda Ege Tunç",
    githubUrl: "https://github.com/aregcodingtech0123",
    linkedinUrl:
      "https://www.linkedin.com/in/arda-ege-tun%C3%A7-7991312b2/",
    email: "contact@example.com",
    location: { en: "Ankara, Turkey", tr: "Ankara, Türkiye" },
    hero: {
      greeting: { en: "Hi, I'm", tr: "Merhaba, ben" },
      name: { en: "Arda Ege Tunç", tr: "Arda Ege Tunç" },
      rolePrefix: {
        en: "I build modern products at the intersection of",
        tr: "Modern ürünleri şu kesişimde inşa ediyorum:",
      },
      ctaProjects: { en: "View Projects", tr: "Projeleri Gör" },
      ctaContact: { en: "Contact Me", tr: "İletişim" },
      badges: {
        ai: { en: "Generative AI", tr: "Üretken Yapay Zeka" },
        fullstack: { en: "Full Stack", tr: "Full Stack" },
        security: { en: "Cybersecurity", tr: "Siber güvenlik" },
      },
      typingRoles: [
        { en: "AI Engineer", tr: "Yapay Zeka Mühendisi" },
        { en: "Full Stack Developer", tr: "Full Stack Geliştirici" },
        { en: "Computer Engineer", tr: "Bilgisayar Mühendisi" },
        { en: "Cybersecurity Enthusiast", tr: "Siber Güvenlik Meraklısı" },
      ],
      profileTagline: {
        en: "AI Engineering · Full Stack · Cybersecurity",
        tr: "Yapay Zeka Mühendisliği · Full Stack · Siber güvenlik",
      },
    },
    about: {
      summary: {
        en: "A fresh Computer Engineering graduate specializing in Generative AI systems, full-stack web development, and cybersecurity.",
        tr: "Üretken yapay zeka sistemleri, full-stack web geliştirme ve siber güvenlik alanlarında uzmanlaşan yeni mezun Bilgisayar Mühendisi.",
      },
      edu1: {
        en: "Ankara Science University — B.Sc. in Computer Engineering (English)",
        tr: "Ankara Bilim Üniversitesi — Bilgisayar Mühendisliği Lisans (İngilizce)",
      },
      edu2: {
        en: "Istanbul University — Economics",
        tr: "İstanbul Üniversitesi — İktisat",
      },
      experienced: { en: "Experienced with", tr: "Deneyim alanları" },
      stats: {
        focus: { en: "Primary focus", tr: "Odak" },
        focusValue: {
          en: "GenAI & secure systems",
          tr: "Üretken yapay zeka ve güvenli sistemler",
        },
        stack: { en: "Core stack", tr: "Temel yığın" },
        stackValue: { en: "React / Next / Python", tr: "React / Next / Python" },
        mindset: { en: "Engineering mindset", tr: "Yaklaşım" },
        mindsetValue: {
          en: "Ship clean, measurable outcomes",
          tr: "Temiz, ölçülebilir sonuçlar üretmek",
        },
      },
    },
    aboutHighlights: [
      { text: { en: "RAG architectures", tr: "RAG mimarileri" } },
      { text: { en: "LangChain", tr: "LangChain" } },
      { text: { en: "LangGraph", tr: "LangGraph" } },
      { text: { en: "React.js", tr: "React.js" } },
      { text: { en: "Next.js", tr: "Next.js" } },
      { text: { en: "AI-assisted development", tr: "Yapay zeka destekli geliştirme" } },
      { text: { en: "Prompt Engineering", tr: "İstem mühendisliği" } },
      { text: { en: "Penetration Testing", tr: "Sızma testi" } },
      { text: { en: "Linux / Bash", tr: "Linux / Bash" } },
    ],
    seo: {
      homeDescription: {
        en: "Portfolio of Arda Ege Tunç — AI engineering, full-stack development, and cybersecurity.",
        tr: "Arda Ege Tunç'un portföyü — yapay zeka mühendisliği, full-stack geliştirme ve siber güvenlik.",
      },
    },
  } satisfies MigrationSiteSettings,

  projects: [
    {
      id: "atmosmind-weather",
      title: {
        en: "AtmosMind Weather Forecast",
        tr: "AtmosMind Weather Forecast",
      },
      description: {
        en: "AtmosMind is an AI-powered intelligent weather dashboard that delivers real-time forecasts, hourly and 7-day predictions, enhanced with a Google Gemini AI assistant for natural conversational weather insights.",
        tr: "AtmosMind, gerçek zamanlı hava durumu tahminleri, saatlik ve 7 günlük öngörüler sunan ve Google Gemini AI asistanı ile doğal sohbet deneyimi sağlayan yapay zeka destekli akıllı bir hava durumu platformudur.",
      },
      technologies: [
        "Next.js",
        "TypeScript",
        "Google Gemini",
        "Weather APIs",
      ],
      category: "ai",
      liveUrl: "https://atmosmindweather.com/",
      order: 0,
      featured: true,
    },
    {
      id: "exqubit",
      title: { en: "Exqubit", tr: "Exqubit" },
      description: {
        en: "Exqubit is an AI-powered assessment platform that instantly generates high-quality, professional multiple-choice quizzes from PDFs and text documents using Google Gemini.",
        tr: "Exqubit, PDF ve metin belgelerinden Google Gemini kullanarak profesyonel kalitede çoktan seçmeli quiz ve değerlendirmeleri anında oluşturan yapay zeka destekli bir eğitim platformudur.",
      },
      technologies: ["Google Gemini", "PDF", "Quiz generation", "AI"],
      category: "ai",
      liveUrl: "https://exqubitai.com/",
      order: 1,
      featured: true,
    },
  ] as MigrationProject[],

  experience: [
    {
      id: "experience-remax",
      company: { en: "RE/MAX Wise", tr: "RE/MAX Wise" },
      role: {
        en: "Full Stack Developer Intern",
        tr: "Full Stack Developer Stajyeri",
      },
      period: { en: "08/2025 – 10/2025", tr: "08/2025 – 10/2025" },
      detail: {
        en: "Built internal tooling and web experiences with a focus on reliability and maintainability.",
        tr: "Güvenilirlik ve sürdürülebilirlik odaklı iç araçlar ve web deneyimleri geliştirdim.",
      },
      order: 0,
    },
    {
      id: "experience-trt",
      company: { en: "TRT", tr: "TRT" },
      role: {
        en: "Full Stack Developer Intern",
        tr: "Full Stack Developer Stajyeri",
      },
      period: { en: "03/2025 – 05/2025", tr: "03/2025 – 05/2025" },
      detail: {
        en: "Collaborated on full-stack features with emphasis on performance and clean architecture.",
        tr: "Performans ve temiz mimariye vurguyla full-stack özellikler üzerinde iş birliği yaptım.",
      },
      order: 1,
    },
    {
      id: "experience-lab",
      company: {
        en: "Ankara Science University",
        tr: "Ankara Bilim Üniversitesi",
      },
      role: {
        en: "Computer Laboratory Assistant",
        tr: "Bilgisayar Laboratuvarı Asistanı",
      },
      period: { en: "10/2023 – 01/2025", tr: "10/2023 – 01/2025" },
      detail: {
        en: "Supported coursework labs, troubleshooting, and mentoring peers on systems and tooling.",
        tr: "Ders laboratuvarlarında destek, sorun giderme ve sistemler konusunda eşlere mentorluk.",
      },
      order: 2,
    },
  ] satisfies MigrationExperience[],

  skillCategories: [
    {
      id: "ai",
      label: {
        en: "AI & Machine Learning",
        tr: "Yapay Zeka ve Makine Öğrenmesi",
      },
      groups: [
        { tier: "expertise", skills: ["LangChain", "RAG"] },
        { tier: "comfortable", skills: ["LangGraph", "Vector Databases"] },
        { tier: "learning", skills: ["LlamaIndex"] },
      ],
      order: 0,
    },
    {
      id: "frontend",
      label: {
        en: "Frontend Development",
        tr: "Ön Uç Geliştirme",
      },
      groups: [
        { tier: "expertise", skills: ["React.js", "Next.js"] },
        { tier: "comfortable", skills: ["JavaScript", "TypeScript"] },
        { tier: "learning", skills: ["Web Animations"] },
      ],
      order: 1,
    },
    {
      id: "backend",
      label: {
        en: "Backend Development",
        tr: "Arka Uç Geliştirme",
      },
      groups: [
        { tier: "expertise", skills: ["Python"] },
        { tier: "comfortable", skills: ["Java"] },
        { tier: "learning", skills: ["Go"] },
      ],
      order: 2,
    },
    {
      id: "security",
      label: { en: "Cybersecurity", tr: "Siber Güvenlik" },
      groups: [
        { tier: "expertise", skills: ["Penetration Testing"] },
        { tier: "comfortable", skills: ["Vulnerability Scanning"] },
        { tier: "learning", skills: ["Cloud Security"] },
      ],
      order: 3,
    },
    {
      id: "languages",
      label: { en: "Languages & Tools", tr: "Diller ve Araçlar" },
      groups: [
        { tier: "expertise", skills: ["Linux / Bash"] },
        { tier: "comfortable", skills: ["Git"] },
        { tier: "learning", skills: ["Docker"] },
      ],
      order: 4,
    },
  ] satisfies MigrationSkillCategory[],

  educationCertificates: [
    { name: "Certificate of Cloud Computing with AWS", issuer: "BTK Akademi", date: "March 2026" },
    { name: "Developing AI Agents using Platforms", issuer: "BTK Akademi", date: "March 2026" },
    { name: "Talent Coders Code Genius Certificate", issuer: "Talentcoders", date: "February 2026" },
    { name: "Introduction to Generative AI", issuer: "BTK Akademi", date: "February 2026" },
    { name: "Advanced Cyber Security in Technologies", issuer: "HAVELSAN", date: "February 2024" },
    { name: "AI Literacy", issuer: "Ankara Science University", date: "May 2024" },
    { name: "3D Design and Printing", issuer: "KA3D Arge Tasarım", date: "October 2022" },
    { name: "Java Lab Assistantship", issuer: "Ankara Science University" },
    { name: "Internship Completion Certificate", issuer: "RE/MAX Wise", date: "October 2025" },
    { name: "Blockchain Training", issuer: "1. Vision & Efficiency Summit", date: "May 2023" },
    { name: "Ethical Hacking Training", issuer: "1. Vision & Efficiency Summit", date: "May 2023" },
    { name: "Game & AI Training", issuer: "VES 2024", date: "May 2024" },
    { name: "Penetration Testing", issuer: "CSCON'22", date: "March 2022" },
    { name: "SEM Education Certificate", issuer: "FSMVU / Altin Kariyer", date: "July 2023" },
  ] satisfies CertificateItem[],

  participationCertificates: [
    { name: "Ankara Start-Up Summit", issuer: "Bilkent University", date: "November 2025" },
    { name: "Career Summit'25", issuer: "BTK Akademi", date: "December 2025" },
    {
      name: "Ankara Development Summit",
      issuer: "Senda Etkinlik (featuring İlber Ortaylı, Celal Şengör, Naci Görür)",
      date: "May 2025",
    },
    { name: "Cloud Computing & AI Summit 2024", issuer: "BTK Akademi", date: "December 2024" },
    { name: "Cloud Computing & AI Summit 2023", issuer: "BTK Akademi", date: "October 2023" },
    { name: "Science Communication Volunteering Program", issuer: "T3 Foundation", date: "2024" },
    { name: "TÜBİTAK-4007 Science Wind Workshop Mentorship", issuer: "TÜBİTAK", date: "November 2024" },
  ] satisfies CertificateItem[],
} as const;

export function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
