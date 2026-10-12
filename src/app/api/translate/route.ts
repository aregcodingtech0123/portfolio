import { NextResponse } from "next/server";
import { isTranslateEnabled } from "@/lib/env-validation";
import { isJsonContentType, readLimitedBody } from "@/lib/request-body";
import { TranslateError, translateText } from "@/lib/translate/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Largest body accepted. The text is capped at 5,000 characters; even if every
 * one were JSON-escaped as \uXXXX (6 bytes) that is 30,000 bytes, plus the
 * envelope. Anything bigger is not a real request.
 */
const MAX_BODY_BYTES = 32 * 1024;

type Body = {
  text?: unknown;
};

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * EN→TR translation via Google Gemini API, for the Studio's translate button.
 *
 * POST /api/translate
 * Body: { text: string }   (Content-Type: application/json)
 * Response: { translatedText: string } | { error: string }
 *
 * Access: this route is NOT authenticated. It is switched off in production
 * unless TRANSLATE_ENABLED=true (see isTranslateEnabled), and answers 404 when
 * off so an anonymous caller learns nothing. If it is enabled on a public
 * host, put the rate limit from docs/security/rate-limiting.md in front of it.
 *
 * Error bodies are generic by design. Anything that could name an environment
 * variable or repeat the upstream's wording goes to the server log only.
 */
export async function POST(request: Request) {
  if (!isTranslateEnabled(process.env, process.env.NODE_ENV === "production")) {
    return json({ error: "Not found" }, 404);
  }

  // A browser states where a request came from. The Studio's own fetch is
  // same-origin; anything a browser reports as cross-site (a form or fetch on
  // another website pointing here) is refused. Absent on curl and old
  // browsers, which this does not try to stop: that is the rate limit's job.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return json({ error: "Cross-site requests are not allowed" }, 403);
  }

  if (!isJsonContentType(request)) {
    return json({ error: "Content-Type must be application/json" }, 415);
  }

  const raw = await readLimitedBody(request, MAX_BODY_BYTES);
  if (!raw.ok) {
    return json({ error: raw.error }, raw.status);
  }

  let body: Body;
  try {
    body = JSON.parse(raw.text) as Body;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (body === null || typeof body !== "object") {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.text !== "string") {
    return json({ error: "text must be a string" }, 400);
  }

  if (!body.text.trim()) {
    return json({ error: "text is required" }, 400);
  }

  try {
    const result = await translateText({ text: body.text });
    return json(result, 200);
  } catch (error) {
    if (error instanceof TranslateError) {
      console.error(`[api/translate] ${error.status}: ${error.message}`);
      return json({ error: error.publicMessage }, error.status);
    }
    console.error(
      "[api/translate] unexpected error:",
      error instanceof Error ? error.message : error,
    );
    return json({ error: "Translation failed" }, 502);
  }
}
