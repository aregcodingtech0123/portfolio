import { expect, test } from "./fixtures";

/*
 * /api/translate has no authentication, so in production it is switched off
 * unless TRANSLATE_ENABLED=true (src/lib/env-validation.ts, isTranslateEnabled).
 * This suite runs against a production build with the flag unset (see
 * playwright.config.ts), so the route must behave as if it does not exist.
 * No request here can reach Gemini: the route answers before any upstream call.
 */

test.describe("/api/translate in a production build with the flag unset", () => {
  test("answers 404 and reveals nothing about why", async ({ request }) => {
    const res = await request.post("/api/translate", { data: { text: "Hello" } });
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(JSON.stringify(await res.text())).not.toMatch(/GEMINI|TRANSLATE_ENABLED|env/i);
    expect(res.headers()["cache-control"]).toBe("no-store");
  });

  test("answers 404 before reading a large body", async ({ request }) => {
    const res = await request.post("/api/translate", {
      headers: { "content-type": "application/json" },
      data: JSON.stringify({ text: "a".repeat(2_000_000) }),
    });
    expect(res.status()).toBe(404);
  });

  test("a cross-site form post (text/plain) gets the same 404", async ({ request }) => {
    const res = await request.post("/api/translate", {
      headers: { "content-type": "text/plain" },
      data: '{"text":"Hello"}',
    });
    expect(res.status()).toBe(404);
  });
});
