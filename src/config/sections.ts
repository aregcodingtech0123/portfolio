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
  | "education"
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
    id: "education",
    navKey: "education",
    inNav: true,
    inFooter: false,
    isVisible: (c) => c.education.length > 0,
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
    inNav: false,
    inFooter: false,
    // Hidden until there is a result to show: an empty scoreboard is only a
    // placeholder ("No public results yet").
    isVisible: (c) => (c.ctfs?.length ?? 0) > 0,
  },
  { id: "contact", navKey: "contact", inNav: true, inFooter: true, isVisible: always },
];

export function visibleSections(content: PortfolioContent): SectionConfig[] {
  return sections.filter((s) => s.isVisible(content));
}

/** Zero-padded section numbers ("01", "02", ...), keyed by section id. */
export type SectionNumbers = Partial<Record<SectionId, string>>;

/**
 * Numbers for the Simple skin's section headers ("01 / About"). They follow
 * the order above, over the sections that are actually rendered, so a hidden
 * section never leaves a gap. `home` is the hero and has no header, so it is
 * not numbered.
 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Numbers for the Terminal skin's "// 03 projects" labels: the rendered
 * sections in config order, home counted as 01 the way the nav counts, so a
 * hidden section never leaves a gap in the sequence.
 */
export function terminalSectionNumbers(content: PortfolioContent): SectionNumbers {
  const numbers: SectionNumbers = {};
  visibleSections(content).forEach((section, index) => {
    numbers[section.id] = pad(index + 1);
  });
  return numbers;
}

export function sectionNumbers(content: PortfolioContent): SectionNumbers {
  const numbers: SectionNumbers = {};
  visibleSections(content)
    .filter((section) => section.id !== "home")
    .forEach((section, index) => {
      numbers[section.id] = pad(index + 1);
    });
  return numbers;
}