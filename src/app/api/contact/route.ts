import { NextResponse } from "next/server";
import {
  isTurnstileSecretConfigured,
  verifyTurnstileToken,
} from "@/lib/turnstile-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  token?: unknown;
};

/**
 * Verifies a Cloudflare Turnstile token before the client sends via EmailJS.
 *
 * POST /api/contact
 * Body: { token: string }
 * Response: { ok: true } | { error: string }
 */
export async function POST(request: Request) {
  if (!isTurnstileSecretConfigured()) {
    return NextResponse.json(
      { error: "Turnstile is not configured on the server" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.token !== "string") {
    return NextResponse.json(
      { error: "token must be a string" },
      { status: 400 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const remoteip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const result = await verifyTurnstileToken(body.token, remoteip);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
