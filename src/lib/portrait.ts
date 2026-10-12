import { existsSync } from "node:fs";
import path from "node:path";

/** Where the hero portrait lives, relative to `public/`. */
export const PORTRAIT_SRC = "/images/profilephoto.jpeg";

/**
 * The portrait path if the file is actually in `public/`, otherwise
 * `undefined` so the hero renders its intentional empty frame.
 *
 * This runs on the server while the page is rendered (at build time for a
 * statically generated page), replacing a per-visit client `HEAD` request.
 * That request was the only thing deciding whether to render the image, so
 * the image could not be in the first HTML response. Server-only: imports `fs`.
 */
export function resolvePortraitSrc(): string | undefined {
  try {
    return existsSync(path.join(process.cwd(), "public", PORTRAIT_SRC))
      ? PORTRAIT_SRC
      : undefined;
  } catch {
    return undefined;
  }
}
