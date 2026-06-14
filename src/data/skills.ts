export type SkillTierId = "expertise" | "comfortable" | "learning";

export type SkillCategoryId =
  | "ai"
  | "frontend"
  | "backend"
  | "security"
  | "languages";

export type SkillTierGroup = {
  tier: SkillTierId;
  skills: string[];
};

export const skillCategories: {
  id: SkillCategoryId;
  groups: SkillTierGroup[];
}[] = [
  {
    id: "ai",
    groups: [
      { tier: "expertise", skills: ["LangChain", "RAG"] },
      { tier: "comfortable", skills: ["LangGraph", "Vector Databases"] },
      { tier: "learning", skills: ["LlamaIndex"] },
    ],
  },
  {
    id: "frontend",
    groups: [
      { tier: "expertise", skills: ["React.js", "Next.js"] },
      { tier: "comfortable", skills: ["JavaScript", "TypeScript"] },
      { tier: "learning", skills: ["Web Animations"] },
    ],
  },
  {
    id: "backend",
    groups: [
      { tier: "expertise", skills: ["Python"] },
      { tier: "comfortable", skills: ["Java"] },
      { tier: "learning", skills: ["Go"] },
    ],
  },
  {
    id: "security",
    groups: [
      { tier: "expertise", skills: ["Penetration Testing"] },
      { tier: "comfortable", skills: ["Vulnerability Scanning"] },
      { tier: "learning", skills: ["Cloud Security"] },
    ],
  },
  {
    id: "languages",
    groups: [
      { tier: "expertise", skills: ["Linux / Bash"] },
      { tier: "comfortable", skills: ["Git"] },
      { tier: "learning", skills: ["Docker"] },
    ],
  },
];
