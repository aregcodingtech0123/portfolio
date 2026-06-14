export type ProjectCategory = "ai" | "fullstack" | "security" | "tooling";

export type ProjectEntry = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  imageSrc?: string;
};

export const projects: ProjectEntry[] = [
  {
    id: "atmosmind-weather",
    titleKey: "atmosTitle",
    descriptionKey: "atmosDesc",
    technologies: [
      "Next.js",
      "TypeScript",
      "Google Gemini",
      "Weather APIs",
    ],
    category: "ai",
    liveUrl: "https://atmosmindweather.com/",
  },
  {
    id: "exqubit",
    titleKey: "exqubitTitle",
    descriptionKey: "exqubitDesc",
    technologies: ["Google Gemini", "PDF", "Quiz generation", "AI"],
    category: "ai",
    liveUrl: "https://exqubitai.com/",
  },
];
