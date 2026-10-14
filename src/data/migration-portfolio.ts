/**
 * The single typed fallback for all portfolio content.
 *
 * Used when Sanity is not configured or returns no structured content (see
 * src/sanity/fetch.ts) and as the seed source for scripts/seed-sanity.ts.
 *
 * Copy rules: first person, plain language, no em dashes, at most two sentences
 * per paragraph. Leave unwritten fields empty or omit them; never seed placeholder hints.
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
  /** Omit until written in Studio; empty values must not reach the page. */
  problem?: LocaleField;
  approach?: LocaleField;
  challenge?: LocaleField;
  learned?: LocaleField;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  order: number;
  featured: boolean;
};

type ExperienceSeed = {
  id: string;
  company: LocaleField;
  role: LocaleField;
  period: LocaleField;
  description: LocaleField;
  /** City and country, or Remote. Omit until entered in Studio. */
  location?: LocaleField;
  order: number;
};

type EducationSeed = {
  id: string;
  institution: LocaleField;
  degree: LocaleField;
  fieldOfStudy: LocaleField;
  /** City and country, or Remote. Omit until entered in Studio. */
  location?: LocaleField;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: LocaleField;
  order: number;
};

type SkillSeed = {
  name: string;
  category: SkillCategoryId;
  /** Shared sort key for the category column (same value for peers). */
  categoryOrder: number;
  /** Sort order within the category. */
  order: number;
  featured?: boolean;
  tier?: SkillTierId;
  level?: SkillLevel;
  /** Project id from `projects` above. Only set when the project really used this skill. */
  evidenceProjectId?: string;
};

/** The university's name in each language, as used by the education and experience entries. */
const ANKARA_SCIENCE_UNIVERSITY: LocaleField = {
  en: "Ankara Science University",
  tr: "Ankara Bilim Üniversitesi",
};

/** Same text in English and Turkish: official certificate names and issuers are not translated yet. */
function sameInBoth(text: string): LocaleField {
  return { en: text, tr: text };
}

/** An issuer given as a plain string has no translation yet: same text in both. */
function issuerField(issuer: string | LocaleField): LocaleField {
  return typeof issuer === "string" ? sameInBoth(issuer) : issuer;
}

function cert(
  title: string,
  issuer: string | LocaleField,
  date?: string,
): CertificateSeed {
  return { title: sameInBoth(title), issuer: issuerField(issuer), date };
}

function certLocalized(
  title: LocaleField,
  issuer: string | LocaleField,
  date?: string,
): CertificateSeed {
  return { title, issuer: issuerField(issuer), date };
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
        tr: "Modern ürünleri şu kesişimde geliştiriyorum:",
      },
      headline: {
        en: "Focusing on continuous growth in AI systems, autonomous agents, full-stack web architectures, and cybersecurity.",
        tr: "Yapay zeka sistemleri, otonom ajanlar, full-stack web mimarileri ve siber güvenlik alanlarında kendimi geliştirmeye odaklanıyorum.",
      },
      subline: {
        en: "Recent Computer Engineering graduate continuously advancing skills in generative AI systems, full-stack web development, and cybersecurity.",
        tr: "Üretken yapay zeka sistemleri, full-stack web geliştirme ve siber güvenlik alanlarında kendini geliştiren yeni mezun Bilgisayar Mühendisi.",
      },
      ctaProjects: { en: "See projects", tr: "Projelere bak" },
      ctaContact: { en: "Write to me", tr: "Bana yaz" },
      badges: {
        ai: { en: "Generative AI", tr: "Üretken Yapay Zeka" },
        fullstack: { en: "Full Stack", tr: "Full Stack" },
        security: { en: "Cybersecurity", tr: "Siber Güvenlik" },
      },
      typingRoles: [
        { en: "Computer Engineer", tr: "Bilgisayar Mühendisi" },
        { en: "Full Stack Developer", tr: "Full Stack Geliştirici" },
        { en: "AI Engineer", tr: "Yapay Zeka Mühendisi" },
        { en: "Cybersecurity Enthusiast", tr: "Siber Güvenlik Meraklısı" },
      ],
      profileTagline: {
        en: "AI Engineering · Full Stack · Cybersecurity",
        tr: "Yapay Zeka Mühendisliği · Full Stack · Siber Güvenlik",
      },
    },
    about: {
      summary: {
        en: "Recent Computer Engineering graduate continuously advancing skills in generative AI systems, full-stack web development, and cybersecurity.",
        tr: "Üretken yapay zeka sistemleri, full-stack web geliştirme ve siber güvenlik alanlarında kendini geliştiren yeni mezun Bilgisayar Mühendisi.",
      },
      paragraphs: [
        {
          en: "Continuously exploring the theoretical foundations and underlying mechanics of AI, translating knowledge into practice by building AI-integrated applications.",
          tr: "Yapay zekanın teorik temellerini ve arka plandaki işleyişini sürekli inceliyor; teorik bilgimi yapay zeka entegrasyonlu projeler geliştirerek pratiğe döküyorum.",
        },
        {
          en: "Developing full-stack web applications while auditing their performance, optimization, and security processes end-to-end.",
          tr: "Full-stack web uygulamaları geliştiriyor; bu sistemlerin performans, optimizasyon ve güvenlik süreçlerini uçtan uca denetliyorum.",
        },
        {
          en: "Actively pursuing training in cybersecurity to build strong fundamentals, aiming to merge AI with cybersecurity to specialize in this intersection in the future.",
          tr: "Siber güvenlik alanında aktif olarak eğitimler alarak kendimi geliştiriyor; gelecekte yapay zeka ile siber güvenliği harmanlayarak bu alanda uzmanlaşmayı hedefliyorum.",
        },
      ] as LocaleField[],
      /** @deprecated Prefer standalone `education` entries below. */
      edu1: {
        en: "Ankara Science University, B.Sc. in Computer Engineering (English)",
        tr: "Ankara Bilim Üniversitesi, Bilgisayar Mühendisliği Lisans (İngilizce)",
      },
      /** @deprecated Prefer standalone `education` entries below. */
      edu2: {
        en: "Istanbul University, Economics",
        tr: "İstanbul Üniversitesi, İktisat",
      },
      experienced: { en: "Skills & tools", tr: "Yetenekler ve araçlar" },
      stats: {
        focus: { en: "Primary focus", tr: "Odak" },
        focusValue: {
          en: "GenAI & secure systems",
          tr: "Üretken yapay zeka ve güvenli sistemler",
        },
        stack: { en: "Core stack", tr: "Teknoloji yığını" },
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
      { text: { en: "Penetration Testing", tr: "Sızma Testi" } },
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
      id: "vocabeacon-ai-powered-language-dictionary",
      code: "PRJ-003",
      status: "live",
      title: {
        en: "VocaBeacon AI-Powered Language Dictionary",
        tr: "VocaBeacon Yapay Zeka Destekli Dil Sözlüğü",
      },
      description: {
        en: "VocaBeacon is an AI-powered multilingual dictionary and language-learning platform that delivers smart definitions, CEFR-based contextual examples, and usage insights driven by Google Gemini.",
        tr: "VocaBeacon, Google Gemini destekli akıllı tanımlar, CEFR tabanlı bağlamsal örnekler ve kullanım analizleri sunan yapay zeka tabanlı çok dilli bir sözlük ve dil öğrenme platformudur.",
      },
      technologies: [
        "Next.js",
        "TypeScript",
        "Node.js",
        "Express",
        "Tailwind CSS",
        "Google Gemini API",
        "REST API",
      ],
      category: "ai",
      liveUrl: "https://vocabeacon-ai-powered-lang-dictiona.vercel.app/",
      order: 0,
      featured: true,
    },
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
      technologies: ["Next.js", "TypeScript", "Google Gemini", "Weather APIs"],
      category: "ai",
      liveUrl: "https://atmosmindweather.com/",
      order: 1,
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
      technologies: ["Google Gemini", "PDF", "Quiz generation", "AI"],
      category: "ai",
      liveUrl: "https://exqubitai.com/",
      order: 2,
      featured: true,
    },
  ] satisfies ProjectSeed[],

  education: [
    {
      id: "education-asbu-ce",
      institution: ANKARA_SCIENCE_UNIVERSITY,
      degree: { en: "B.Sc.", tr: "Lisans" },
      fieldOfStudy: {
        en: "Computer Engineering",
        tr: "Bilgisayar Mühendisliği",
      },
      startDate: "2021",
      endDate: "2025",
      isCurrent: false,
      description: {
        en: "English-medium undergraduate program focused on software systems and applied computing.",
        tr: "Yazılım sistemleri ve uygulamalı bilişim odaklı İngilizce lisans programı.",
      },
      order: 0,
    },
    {
      id: "education-iu-econ",
      institution: {
        en: "Istanbul University",
        tr: "İstanbul Üniversitesi",
      },
      degree: { en: "Undergraduate", tr: "Lisans" },
      fieldOfStudy: { en: "Economics", tr: "İktisat" },
      startDate: "2020",
      endDate: "2021",
      isCurrent: false,
      description: {
        en: "Foundational coursework in economics before transitioning fully into computer engineering.",
        tr: "Bilgisayar mühendisliğine geçmeden önce iktisat alanında temel dersler.",
      },
      order: 1,
    },
  ] satisfies EducationSeed[],

  experience: [
    {
      id: "experience-software-persona",
      company: { en: "Software Persona", tr: "Software Persona" },
      role: { en: "Intern", tr: "Stajyer" },
      period: { en: "06/2026 – 07/2026", tr: "06/2026 – 07/2026" },
      description: {
        en: "Developed a React/Tailwind task-tracking dashboard and a Flutter mobile product-catalog app; also worked with SQL Server and Figma.",
        tr: "React/Tailwind ile görev takip paneli ve Flutter ile mobil ürün kataloğu uygulaması geliştirdim; ayrıca SQL Server ve Figma ile çalıştım.",
      },
      order: 0,
    },
    {
      id: "experience-inspectos",
      company: { en: "InspectOS", tr: "InspectOS" },
      role: {
        en: "Full Stack Developer Intern",
        tr: "Full Stack Developer Stajyeri",
      },
      period: { en: "08/2025 – 10/2025", tr: "08/2025 – 10/2025" },
      description: {
        en: "Developed a buyer's agency web platform for the Lisbon property market. Collaborated in a multicultural Agile team and used AI-assisted prompt-engineering workflows during development and optimization.",
        tr: "Lizbon emlak piyasası için bir alıcı acentesi web platformu geliştirdim. Çok kültürlü bir agile ekipte iş birliği yaptım ve geliştirme ile optimizasyon sırasında AI destekli prompt-engineering iş akışları kullandım.",
      },
      order: 1,
    },
    {
      id: "experience-trt",
      company: { en: "TRT", tr: "TRT" },
      role: {
        en: "Full Stack Developer Intern",
        tr: "Full Stack Developer Stajyeri",
      },
      period: { en: "03/2025 – 05/2025", tr: "03/2025 – 05/2025" },
      description: {
        en: "Contributed to the full-stack development and maintenance of the internal management panel. Implemented REST API integrations and UI components to support administrative workflows.",
        tr: "Dahili yönetim panelinin full-stack geliştirmesine ve bakımına katkıda bulundum; idari iş akışlarını desteklemek için REST API entegrasyonları ve UI bileşenleri uyguladım.",
      },
      order: 2,
    },
    {
      id: "experience-lab",
      company: ANKARA_SCIENCE_UNIVERSITY,
      role: {
        en: "Computer Laboratory Assistant",
        tr: "Bilgisayar Laboratuvarı Asistanı",
      },
      period: { en: "10/2023 – 01/2025", tr: "10/2023 – 01/2025" },
      description: {
        en: "Supported students in Java and object-oriented programming through practical lab sessions.",
        tr: "Öğrencilere Java ve nesne yönelimli programlama konularında uygulamalı laboratuvar oturumları aracılığıyla destek verdim.",
      },
      order: 3,
    },
  ] satisfies ExperienceSeed[],

  /**
   * Skills carry their own category. `level` and `evidenceProjectId` are only set
   * where the repo itself shows the link. Everything else stays unset for the owner to decide.
   */
  skills: [
    { name: "LangChain", category: "ai", categoryOrder: 0, order: 0, featured: true, tier: "expertise" },
    { name: "RAG", category: "ai", categoryOrder: 0, order: 1, featured: true, tier: "expertise" },
    { name: "LangGraph", category: "ai", categoryOrder: 0, order: 2, tier: "comfortable" },
    { name: "Vector Databases", category: "ai", categoryOrder: 0, order: 3, tier: "comfortable" },
    { name: "LlamaIndex", category: "ai", categoryOrder: 0, order: 4, tier: "learning", level: "learning" },

    { name: "React.js", category: "frontend", categoryOrder: 1, order: 0, featured: true, tier: "expertise" },
    { name: "Next.js", category: "frontend", categoryOrder: 1, order: 1, featured: true, tier: "expertise", level: "used-in-project", evidenceProjectId: "atmosmind-weather" },
    { name: "JavaScript", category: "frontend", categoryOrder: 1, order: 2, tier: "comfortable" },
    { name: "TypeScript", category: "frontend", categoryOrder: 1, order: 3, tier: "comfortable", level: "used-in-project", evidenceProjectId: "atmosmind-weather" },
    { name: "Web Animations", category: "frontend", categoryOrder: 1, order: 4, tier: "learning", level: "learning" },

    { name: "Python", category: "backend", categoryOrder: 2, order: 0, featured: true, tier: "expertise" },
    { name: "Java", category: "backend", categoryOrder: 2, order: 1, tier: "comfortable" },
    { name: "Go", category: "backend", categoryOrder: 2, order: 2, tier: "learning", level: "learning" },

    { name: "Penetration Testing", category: "security", categoryOrder: 3, order: 0, featured: true, tier: "expertise" },
    { name: "Vulnerability Scanning", category: "security", categoryOrder: 3, order: 1, tier: "comfortable" },
    { name: "Cloud Security", category: "security", categoryOrder: 3, order: 2, tier: "learning", level: "learning" },

    { name: "Linux / Bash", category: "languages", categoryOrder: 4, order: 0, featured: true, tier: "expertise" },
    { name: "Git", category: "languages", categoryOrder: 4, order: 1, tier: "comfortable" },
    { name: "Docker", category: "languages", categoryOrder: 4, order: 2, tier: "learning", level: "learning" },
  ] satisfies SkillSeed[],

  educationCertificates: [
    cert("Certificate of Cloud Computing with AWS", "BTK Akademi", "March 2026"),
    cert("Developing AI Agents using Platforms", "BTK Akademi", "March 2026"),
    cert("Talent Coders Code Genius Certificate", "Talentcoders", "February 2026"),
    cert("Introduction to Generative AI", "BTK Akademi", "February 2026"),
    cert("Advanced Cyber Security in Technologies", "HAVELSAN", "February 2024"),
    cert("AI Literacy", ANKARA_SCIENCE_UNIVERSITY, "May 2024"),
    cert("3D Design and Printing", "KA3D Arge Tasarım", "October 2022"),
    certLocalized(
      {
        en: "Java Lab Assistantship",
        tr: "Java Laboratuvar Asistanlığı",
      },
      ANKARA_SCIENCE_UNIVERSITY,
    ),
    cert("Internship Completion Certificate", "RE/MAX Wise", "October 2025"),
    cert("Blockchain Training", "1. Vision & Efficiency Summit", "May 2023"),
    cert("Ethical Hacking Training", "1. Vision & Efficiency Summit", "May 2023"),
    cert("Game & AI Training", "VES 2024", "May 2024"),
    certLocalized(
      { en: "Penetration Testing", tr: "Sızma Testi" },
      "CSCON'22",
      "March 2022",
    ),
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
