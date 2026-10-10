import type { PortfolioContent } from "@/sanity/fetch";

/**
 * Single source of structure for the home page.
 * `order` is the render order on the page. The nav and footer follow the same order.
 * `isVisible` hides a section, and its nav link, when it has no content to show.
 */
export type SectionId =
  | "home"
  | "about"
  | "projects"
  | "experience"
  | "skills"
  | "certificates"
  | "ctf"
  | "contact";

export type SectionConfig = {
  id: SectionId;
  /** Key under the `Nav` messages namespace. */
  navKey: SectionId;
  inNav: boolean;
  inFooter: boolean;
  isVisible: (content: PortfolioContent) => boolean;
};

const always = () => true;

export const sections: readonly SectionConfig[] = [
  { id: "home", navKey: "home", inNav: true, inFooter: true, isVisible: always },
  { id: "about", navKey: "about", inNav: true, inFooter: true, isVisible: always },
  {
    id: "projects",
    navKey: "projects",
    inNav: true,
    inFooter: true,
    isVisible: (c) => c.projects.length > 0,
  },
  {
    id: "experience",
    navKey: "experience",
    inNav: true,
    inFooter: false,
    isVisible: (c) => c.experience.length > 0,
  },
  {
    id: "skills",
    navKey: "skills",
    inNav: true,
    inFooter: true,
    isVisible: (c) => c.skillCategories.length > 0,
  },
  {
    id: "certificates",
    navKey: "certificates",
    inNav: true,
    inFooter: false,
    isVisible: (c) =>
      c.educationCertificates.length + c.participationCertificates.length > 0,
  },
  {
    id: "ctf",
    navKey: "ctf",
    inNav: true,
    inFooter: false,
    isVisible: always,
  },
  { id: "contact", navKey: "contact", inNav: true, inFooter: true, isVisible: always },
];

export function visibleSections(content: PortfolioContent): SectionConfig[] {
  return sections.filter((s) => s.isVisible(content));
}
