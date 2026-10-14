/**
 * Facts the site owner confirmed for search metadata and structured data.
 *
 * The content layer cannot express them (it has no "completed" flag on an
 * education entry, and no notion of which profile links are verified), so
 * they live here. Anything not listed is left out of the structured data
 * rather than guessed. Change a value only when the owner confirms the new
 * one.
 */
import type { SocialLinksDisplay } from "@/sanity/types";
import type { SiteLocale } from "./site";

/** A profile link the site shows (content.social), by key. */
export type ProfileKey = keyof SocialLinksDisplay;

export type OwnerIdentity = {
  /**
   * Job title, per locale. It must stay identical to the visible role badge
   * (messages/*.json Hero.roleBadge); a unit test pins the two together.
   */
  jobTitle: Record<SiteLocale, string>;
  /**
   * The site's profile links the owner confirmed as their own, by key. Their
   * URLs are read from the content (content.social, the same values the
   * visible GitHub and LinkedIn links use), never copied here, so `sameAs`
   * always equals what the page links to. A profile not listed is left out.
   */
  confirmedProfiles: readonly ProfileKey[];
  /** Education entry ids (fallback id = seeded Sanity _id) of completed degrees. */
  completedDegreeIds: readonly string[];
  /** Whether the hero portrait may be used as Person.image and in previews. */
  portraitAllowed: boolean;
};

export const OWNER_IDENTITY: OwnerIdentity = {
  jobTitle: { en: "Computer Engineer", tr: "Bilgisayar Mühendisi" },
  confirmedProfiles: ["github", "linkedin"],
  completedDegreeIds: ["education-asbu-ce"],
  portraitAllowed: true,
};
