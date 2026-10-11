import { NextResponse } from "next/server";
import { TranslateError, translateText } from "@/lib/translate/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  text?: unknown;
};

/**
 * EN→TR translation via Google Gemini API.
 *
 * POST /api/translate
 * Body: { text: string }
 * Response: { translatedText: string }
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (typeof body.text !== "string") {
    return NextResponse.json(
      { error: "text must be a string" },
      { status: 400 },
    );
  }

  if (!body.text.trim()) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 },
    );
  }

  try {
    const result = await translateText({ text: body.text });
    return NextResponse.json(result);
  } catch (error) {
    const status =
      error instanceof TranslateError
        ? error.status
        : /429|rate.?limit|quota/i.test(
              error instanceof Error ? error.message : "",
            )
          ? 429
          : 502;
    const message =
      error instanceof Error ? error.message : "Translation failed";

    console.error("[api/translate]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
