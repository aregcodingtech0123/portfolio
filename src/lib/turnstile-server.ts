/**
 * Server-only Turnstile verification. Do not import from Client Components.
 */
import "server-only";

const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";

export function isTurnstileSecretConfigured() {
  return turnstileSecretKey.length > 0;
}

type SiteverifyResult = {
  success: boolean;
  "error-codes"?: string[];
};

/**
 * Validates a Turnstile token with Cloudflare's Siteverify API.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!turnstileSecretKey) {
    return { ok: false, error: "Turnstile secret is not configured" };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "Turnstile token is required" };
  }

  try {
    const body: Record<string, string> = {
      secret: turnstileSecretKey,
      response: trimmed,
    };
    if (remoteip) body.remoteip = remoteip;

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const result = (await response.json()) as SiteverifyResult;
    if (!result.success) {
      const codes = result["error-codes"]?.join(", ") || "unknown";
      console.error("[turnstile] siteverify failed:", codes);
      return { ok: false, error: "Turnstile verification failed" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[turnstile] siteverify error:", err);
    return { ok: false, error: "Turnstile verification unavailable" };
  }
}
