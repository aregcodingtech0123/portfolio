/**
 * The hero portrait path, or `undefined` when no photo file exists.
 *
 * Whether the file is in `public/` is decided once, at build time, in
 * next.config.ts (it sets HERO_PORTRAIT_SRC), not per visit. It used to be a
 * client-side HEAD request, which kept the image out of the first HTML; and a
 * filesystem check while rendering would break on hosts whose server bundle
 * does not contain `public/`, silently dropping the photo on every
 * revalidation of a statically generated page.
 */
export function heroPortraitSrc(): string | undefined {
  return process.env.HERO_PORTRAIT_SRC || undefined;
}
