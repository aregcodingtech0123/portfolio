// Keys reachable only through dynamic patterns too specific, or too
// cross-file, to generalize into check-i18n.mjs's static resolver (which
// does recognize the same-file "lookup object" shape -- see
// resolveLookupObjectAccess there). Each entry names exactly where and how
// the key is actually reached, so a future reader can verify the claim
// rather than trust the allowlist blindly. Adding an entry here should be
// the exception, not the default: prefer teaching the checker a pattern
// when the same shape is likely to recur.
export const i18nDynamicAllowlist = [
  {
    key: "Nav.home",
    reason:
      'Reached via Navbar.tsx\'s t(key) and Footer.tsx\'s n(key), where `key` is the `navKey` field of a src/config/sections.ts entry (filtered by inNav/inFooter). The enumerable set lives in a different file than the call site, so this is a cross-file link, not a same-file lookup object the checker can trace.',
  },
  {
    key: "Nav.about",
    reason: "Same cross-file navKey link as Nav.home.",
  },
  {
    key: "Nav.projects",
    reason: "Same cross-file navKey link as Nav.home.",
  },
  {
    key: "Nav.experience",
    reason:
      "Same cross-file navKey link as Nav.home, reached via Navbar.tsx only (this section's inFooter is false).",
  },
  {
    key: "Nav.education",
    reason:
      "Same cross-file navKey link as Nav.home, reached via Navbar.tsx only (this section's inFooter is false).",
  },
  {
    key: "Nav.skills",
    reason: "Same cross-file navKey link as Nav.home.",
  },
  {
    key: "Nav.certificates",
    reason:
      "Same cross-file navKey link as Nav.home, reached via Navbar.tsx only (this section's inFooter is false).",
  },
  {
    key: "Nav.contact",
    reason: "Same cross-file navKey link as Nav.home.",
  },
  {
    key: "Social.github",
    reason:
      'Reached via SocialSidebar.tsx\'s t(labelKey), where `labelKey` is destructured per item from a local array-of-objects literal ({ labelKey: "github" as const, ... }), not a plain OBJECT[x] lookup the checker resolves.',
  },
  {
    key: "Social.linkedin",
    reason: "Same array-literal destructuring link as Social.github.",
  },
  {
    key: "Skills.categories.ai",
    reason:
      'Reached via Skills.tsx\'s `cat.id in CATEGORY_PATH ? t(`categories.${cat.id}`) : cat.id`: the interpolated expression is the bare key itself (cat.id), guarded by an `in` check on CATEGORY_PATH, not CATEGORY_PATH\'s *values* -- the inverse of the OBJECT[x]-value shape the checker resolves.',
  },
  {
    key: "Skills.categories.frontend",
    reason: "Same CATEGORY_PATH `in`-guard link as Skills.categories.ai.",
  },
  {
    key: "Skills.categories.backend",
    reason: "Same CATEGORY_PATH `in`-guard link as Skills.categories.ai.",
  },
  {
    key: "Skills.categories.security",
    reason: "Same CATEGORY_PATH `in`-guard link as Skills.categories.ai.",
  },
  {
    key: "Skills.categories.languages",
    reason: "Same CATEGORY_PATH `in`-guard link as Skills.categories.ai.",
  },
];
