import { expect, test } from "./fixtures";

/*
 * /_next/image only optimises images next.config.ts allows
 * (src/sanity/image-patterns.ts). This build has no Sanity project id, so no
 * remote image is allowed at all: a request for any cdn.sanity.io URL must be
 * refused before the server fetches anything (so no network is involved), and
 * a local image must still be served. The "your project's images are allowed,
 * another project's are not" half is proved with Next's own matcher in
 * src/sanity/image-patterns.test.ts.
 */

test("the optimizer refuses a remote Sanity image it was not configured for", async ({ request }) => {
  const url = encodeURIComponent("https://cdn.sanity.io/images/someoneelse/production/abc-100x100.jpg");
  const res = await request.get(`/_next/image?url=${url}&w=640&q=75`);
  expect(res.status()).toBe(400);
});

test("the optimizer still serves a local image", async ({ request }) => {
  const res = await request.get(
    `/_next/image?url=${encodeURIComponent("/images/profilephoto.jpeg")}&w=640&q=75`,
  );
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^image\//);
});
