/**
 * Facts the site owner confirmed for search metadata and structured data.
 *
 * The content layer cannot express them (it has no "completed" flag on an
 * education entry, and no notion of which profile links are verified), so
 * they live here. Anything not listed is left out of the structured data
 * rather than guessed. Change a value only when the owner confirms the new
 * one.
 */
import type { SiteLocale } from "./site";

export type OwnerIdentity = {
  /**
   * Job title, per locale. It must stay identical to the visible role badge
   * (messages/*.json Hero.roleBadge); a unit test pins the two together.
   */
  jobTitle: Record<SiteLocale, string>;
  /**
   * Profile URLs confirmed as the owner's own. A social link from the content
   * is emitted as `sameAs` only when it is in this list, so an edited or
   * mistyped link in Sanity cannot assert a wrong identity.
   */
  confirmedProfileUrls: readonly string[];
  /** Education entry ids (fallback id = seeded Sanity _id) of completed degrees. */
  completedDegreeIds: readonly string[];
  /** Whether the hero portrait may be used as Person.image and in previews. */
  portraitAllowed: boolean;
};

export const OWNER_IDENTITY: OwnerIdentity = {
  jobTitle: { en: "Computer Engineer", tr: "Bilgisayar Mühendisi" },
  confirmedProfileUrls: ["https://github.com/aregcodingtech0123"],
  completedDegreeIds: ["education-asbu-ce"],
  portraitAllowed: true,
};
