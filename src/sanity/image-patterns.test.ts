import { matchRemotePattern } from "next/dist/shared/lib/match-remote-pattern";
import { describe, expect, it } from "vitest";
import { sanityImageRemotePatterns } from "@/sanity/image-patterns";

/**
 * Next's own matcher (the one /_next/image uses) is run against the patterns,
 * so this proves what the optimiser will accept without a request to Sanity.
 */
function allowed(projectId: string, url: string) {
  const patterns = sanityImageRemotePatterns(projectId);
  return patterns.some((p) => matchRemotePattern(p, new URL(url)));
}

describe("sanityImageRemotePatterns", () => {
  const ID = "abc123xy";

  it("accepts this project's images, in any dataset, with the query the URL builder adds", () => {
    expect(allowed(ID, `https://cdn.sanity.io/images/${ID}/production/0a1b2c-960x600.jpg`)).toBe(true);
    expect(allowed(ID, `https://cdn.sanity.io/images/${ID}/staging/0a1b2c-960x600.png?w=960&h=600&auto=format`)).toBe(true);
  });

  it.each([
    ["another project's image", "https://cdn.sanity.io/images/otherproj/production/x-1x1.jpg"],
    ["a prefix of the id", "https://cdn.sanity.io/images/abc123/production/x-1x1.jpg"],
    ["a longer id with the same prefix", `https://cdn.sanity.io/images/${ID}evil/production/x-1x1.jpg`],
    ["a file asset, not an image", `https://cdn.sanity.io/files/${ID}/production/x.pdf`],
    ["the project id outside /images/", `https://cdn.sanity.io/other/images/${ID}/production/x.jpg`],
    ["a path-traversal attempt", `https://cdn.sanity.io/images/${ID}/../otherproj/production/x.jpg`],
    ["plain http", `http://cdn.sanity.io/images/${ID}/production/x.jpg`],
    ["another host", `https://evil.example/images/${ID}/production/x.jpg`],
    ["a lookalike host", `https://cdn.sanity.io.evil.example/images/${ID}/production/x.jpg`],
  ])("rejects %s", (_label, url) => {
    expect(allowed(ID, url)).toBe(false);
  });

  it("allows no remote images when Sanity is not configured", () => {
    expect(sanityImageRemotePatterns(undefined)).toEqual([]);
    expect(sanityImageRemotePatterns("")).toEqual([]);
    expect(sanityImageRemotePatterns("   ")).toEqual([]);
  });

  it.each(["*", "abc/**", "abc*", "a b", "../x", "abc.def"])(
    "refuses to put the unsafe project id %j into a glob",
    (bad) => {
      expect(() => sanityImageRemotePatterns(bad)).toThrow(/letters and digits/);
    },
  );
});
