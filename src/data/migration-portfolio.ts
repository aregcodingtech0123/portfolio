/**
 * The single typed fallback for all portfolio content.
 *
 * Used when Sanity is not configured or returns no structured content (see
 * src/sanity/fetch.ts) and as the seed source for scripts/seed-sanity.ts.
 *
 * Copy rules: first person, plain language, no em dashes, at most two sentences
 * per paragraph. Anything the site owner has not written yet is a [TODO: ...] hint.
 */
import type {
  LocaleField,
  ProjectCategory,
  ProjectStatus,
  SkillCategoryId,
  SkillLevel,
  SkillTierId,
} from "@/sanity/types";

type CertificateSeed = {
  title: LocaleField;
  issuer: LocaleField;
  date?: string;
};

type ProjectSeed = {
  id: string;
  code: string;
  status: ProjectStatus;
  title: LocaleField;
  description: LocaleField;
  problem: LocaleField;
  approach: LocaleField;
  challenge: LocaleField;
  learned: LocaleField;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  order: number;
  featured: boolean;
};

type SkillSeed = {
  name: string;
  categoryId: SkillCategoryId;
  tier: SkillTierId;
  level?: SkillLevel;
  /** Project id from `projects` above. Only set when the project really used this skill. */
  evidenceProjectId?: string;
  order: number;
};

/** Same text in English and Turkish: official certificate names and issuers are not translated yet. */
function sameInBoth(text: string): LocaleField {
  return { en: text, tr: text };
}

function cert(
  title: string,
  issuer: string,
  date?: string,
): CertificateSeed {
  return { title: sameInBoth(title), issuer: sameInBoth(issuer), date };
}

function todo(en: string, tr: string): LocaleField {
  return { en: `[TODO: ${en}]`, tr: `[TODO: ${tr}]` };
}

export const migrationPortfolio = {
  siteSettings: {
    siteName: "Arda Ege Tunç",
    githubUrl: "https://github.com/aregcodingtech0123",
    linkedinUrl:
      "https://www.linkedin.com/in/arda-ege-tun%C3%A7-7991312b2/",
    /** Empty on purpose: the contact email row is hidden until a real address is set in Studio. */
    email: "",
    location: { en: "Ankara, Turkey", tr: "Ankara, Türkiye" },
    hero: {
      greeting: { en: "Hi, I'm", tr: "Merhaba, ben" },
      eyebrow: { en: "$ whoami", tr: "$ whoami" },
      name: { en: "Arda Ege Tunç", tr: "Arda Ege Tunç" },
      rolePrefix: {
        en: "I build modern products at the intersection of",
        tr: "Modern ürünleri şu kesişimde inşa ediyorum:",
      },
      headline: {
        en: "I build AI systems, then I try to break them.",
        tr: "AI sistemleri kuruyorum. Sonra onları kırmaya çalışıyorum.",
      },
      subline: {
        en: "I work where AI engineering meets cybersecurity. Here are the projects I have built, the CTFs I have solved, and what I have learned.",
        tr: "Yapay zeka mühendisliği ile siber güvenliğin kesiştiği yerde çalışıyorum. Burada yaptığım projeler, çözdüğüm CTF'ler ve öğrendiklerim var.",
      },
      ctaProjects: { en: "See projects", tr: "Projelere bak" },
      ctaContact: { en: "Write to me", tr: "Bana yaz" },
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
      paragraphs: [
        todo(
          "Who you are, in two sentences. Where you study and what you are working toward.",
          "Kim olduğun, iki cümleyle. Nerede okuduğun ve nereye yöneldiğin.",
        ),
        todo(
          "What you are building or studying now, and why AI and security matter to you.",
          "Şu an neyi inşa ettiğin ya da neyi öğrendiğin ve yapay zeka ile güvenliğin neden önemli olduğu.",
        ),
        todo(
          "How you work: one thing you check before you ship, and one thing you care about in code.",
          "Nasıl çalıştığın: yayına almadan önce kontrol ettiğin bir şey ve kodda önem verdiğin bir şey.",
        ),
      ],
      edu1: {
        en: "Ankara Science University, B.Sc. in Computer Engineering (English)",
        tr: "Ankara Bilim Üniversitesi, Bilgisayar Mühendisliği Lisans (İngilizce)",
      },
      edu2: {
        en: "Istanbul University, Economics",
        tr: "İstanbul Üniversitesi, İktisat",
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
        en: "Portfolio of Arda Ege Tunç: AI engineering, full-stack development, and cybersecurity.",
        tr: "Arda Ege Tunç'un portföyü: yapay zeka mühendisliği, full-stack geliştirme ve siber güvenlik.",
      },
    },
  },

  projects: [
    {
      id: "atmosmind-weather",
      code: "PRJ-001",
      status: "live",
      title: {
        en: "AtmosMind Weather Forecast",
        tr: "AtmosMind Weather Forecast",
      },
      description: {
        en: "AtmosMind is an AI-powered intelligent weather dashboard that delivers real-time forecasts, hourly and 7-day predictions, enhanced with a Google Gemini AI assistant for natural conversational weather insights.",
        tr: "AtmosMind, gerçek zamanlı hava durumu tahminleri, saatlik ve 7 günlük öngörüler sunan ve Google Gemini AI asistanı ile doğal sohbet deneyimi sağlayan yapay zeka destekli akıllı bir hava durumu panelidir.",
      },
      problem: todo(
        "What problem did AtmosMind solve for you? Two sentences, first person.",
        "AtmosMind sana hangi sorunu çözdürdü? İki cümle, birinci şahıs.",
      ),
      approach: todo(
        "How did you build it? Name the key decisions, not the feature list.",
        "Nasıl inşa ettin? Özellik listesi değil, önemli kararları yaz.",
      ),
      challenge: todo(
        "What was the hardest part, and what did you do about it?",
        "En zor kısım neydi ve ona karşı ne yaptın?",
      ),
      learned: todo(
        "What would you carry into the next project?",
        "Bir sonraki projeye neyi taşıyacaksın?",
      ),
      technologies: ["Next.js", "TypeScript", "Google Gemini", "Weather APIs"],
      category: "ai",
      liveUrl: "https://atmosmindweather.com/",
      order: 0,
      featured: true,
    },
    {
      id: "exqubit",
      code: "PRJ-002",
      status: "live",
      title: { en: "Exqubit", tr: "Exqubit" },
      description: {
        en: "Exqubit is an AI-powered assessment platform that instantly generates high-quality, professional multiple-choice quizzes from PDFs and text documents using Google Gemini.",
        tr: "Exqubit, PDF ve metin belgelerinden Google Gemini kullanarak profesyonel kalitede çoktan seçmeli quiz ve değerlendirmeleri anında oluşturan yapay zeka destekli bir eğitim platformudur.",
      },
      problem: todo(
        "What problem did Exqubit solve for you? Two sentences, first person.",
        "Exqubit sana hangi sorunu çözdürdü? İki cümle, birinci şahıs.",
      ),
      approach: todo(
        "How did you build it? Name the key decisions, not the feature list.",
        "Nasıl inşa ettin? Özellik listesi değil, önemli kararları yaz.",
      ),
      challenge: todo(
        "What was the hardest part, and what did you do about it?",
        "En zor kısım neydi ve ona karşı ne yaptın?",
      ),
      learned: todo(
        "What would you carry into the next project?",
        "Bir sonraki projeye neyi taşıyacaksın?",
      ),
      technologies: ["Google Gemini", "PDF", "Quiz generation", "AI"],
      category: "ai",
      liveUrl: "https://exqubitai.com/",
      order: 1,
      featured: true,
    },
  ] satisfies ProjectSeed[],

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
  ],

  skillCategories: [
    { id: "ai", label: { en: "AI & Machine Learning", tr: "Yapay Zeka ve Makine Öğrenmesi" }, order: 0 },
    { id: "frontend", label: { en: "Frontend Development", tr: "Ön Uç Geliştirme" }, order: 1 },
    { id: "backend", label: { en: "Backend Development", tr: "Arka Uç Geliştirme" }, order: 2 },
    { id: "security", label: { en: "Cybersecurity", tr: "Siber Güvenlik" }, order: 3 },
    { id: "languages", label: { en: "Languages & Tools", tr: "Diller ve Araçlar" }, order: 4 },
  ] satisfies { id: SkillCategoryId; label: LocaleField; order: number }[],

  /**
   * Skills are plain names with a tier. `level` and `evidenceProjectId` are only set
   * where the repo itself shows the link. Everything else stays unset for the owner to decide.
   */
  skills: [
    { name: "LangChain", categoryId: "ai", tier: "expertise", order: 0 },
    { name: "RAG", categoryId: "ai", tier: "expertise", order: 1 },
    { name: "LangGraph", categoryId: "ai", tier: "comfortable", order: 2 },
    { name: "Vector Databases", categoryId: "ai", tier: "comfortable", order: 3 },
    { name: "LlamaIndex", categoryId: "ai", tier: "learning", level: "learning", order: 4 },

    { name: "React.js", categoryId: "frontend", tier: "expertise", order: 5 },
    { name: "Next.js", categoryId: "frontend", tier: "expertise", level: "used-in-project", evidenceProjectId: "atmosmind-weather", order: 6 },
    { name: "JavaScript", categoryId: "frontend", tier: "comfortable", order: 7 },
    { name: "TypeScript", categoryId: "frontend", tier: "comfortable", level: "used-in-project", evidenceProjectId: "atmosmind-weather", order: 8 },
    { name: "Web Animations", categoryId: "frontend", tier: "learning", level: "learning", order: 9 },

    { name: "Python", categoryId: "backend", tier: "expertise", order: 10 },
    { name: "Java", categoryId: "backend", tier: "comfortable", order: 11 },
    { name: "Go", categoryId: "backend", tier: "learning", level: "learning", order: 12 },

    { name: "Penetration Testing", categoryId: "security", tier: "expertise", order: 13 },
    { name: "Vulnerability Scanning", categoryId: "security", tier: "comfortable", order: 14 },
    { name: "Cloud Security", categoryId: "security", tier: "learning", level: "learning", order: 15 },

    { name: "Linux / Bash", categoryId: "languages", tier: "expertise", order: 16 },
    { name: "Git", categoryId: "languages", tier: "comfortable", order: 17 },
    { name: "Docker", categoryId: "languages", tier: "learning", level: "learning", order: 18 },
  ] satisfies SkillSeed[],

  educationCertificates: [
    cert("Certificate of Cloud Computing with AWS", "BTK Akademi", "March 2026"),
    cert("Developing AI Agents using Platforms", "BTK Akademi", "March 2026"),
    cert("Talent Coders Code Genius Certificate", "Talentcoders", "February 2026"),
    cert("Introduction to Generative AI", "BTK Akademi", "February 2026"),
    cert("Advanced Cyber Security in Technologies", "HAVELSAN", "February 2024"),
    cert("AI Literacy", "Ankara Science University", "May 2024"),
    cert("3D Design and Printing", "KA3D Arge Tasarım", "October 2022"),
    cert("Java Lab Assistantship", "Ankara Science University"),
    cert("Internship Completion Certificate", "RE/MAX Wise", "October 2025"),
    cert("Blockchain Training", "1. Vision & Efficiency Summit", "May 2023"),
    cert("Ethical Hacking Training", "1. Vision & Efficiency Summit", "May 2023"),
    cert("Game & AI Training", "VES 2024", "May 2024"),
    cert("Penetration Testing", "CSCON'22", "March 2022"),
    cert("SEM Education Certificate", "FSMVU / Altin Kariyer", "July 2023"),
  ] satisfies CertificateSeed[],

  participationCertificates: [
    cert("Ankara Start-Up Summit", "Bilkent University", "November 2025"),
    cert("Career Summit'25", "BTK Akademi", "December 2025"),
    cert(
      "Ankara Development Summit",
      "Senda Etkinlik (featuring İlber Ortaylı, Celal Şengör, Naci Görür)",
      "May 2025",
    ),
    cert("Cloud Computing & AI Summit 2024", "BTK Akademi", "December 2024"),
    cert("Cloud Computing & AI Summit 2023", "BTK Akademi", "October 2023"),
    cert("Science Communication Volunteering Program", "T3 Foundation", "2024"),
    cert("TÜBİTAK-4007 Science Wind Workshop Mentorship", "TÜBİTAK", "November 2024"),
  ] satisfies CertificateSeed[],
} as const;

export function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
