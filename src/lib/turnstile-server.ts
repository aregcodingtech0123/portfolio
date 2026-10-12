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

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
/** Cloudflare's own examples use 10 s; a captcha check should never take longer. */
const SITEVERIFY_TIMEOUT_MS = 8_000;
/** Cloudflare's documented dummy keys start 1x/2x/3x; real keys start 0x. */
const TEST_SECRET_PATTERN = /^[123]x/;

/** Error codes that mean our configuration is wrong, not the visitor's token. */
const CONFIG_ERROR_CODES = new Set(["missing-input-secret", "invalid-input-secret", "bad-request"]);

type SiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
};

export type TurnstileCheck = {
  /** Hostnames the widget may have run on. Empty: not checked. */
  expectedHostnames: readonly string[];
  /** The action set on the widget. Undefined: not checked. */
  expectedAction?: string;
  remoteip?: string | null;
};

export type TurnstileVerdict =
  | { ok: true }
  /** The token is missing, forged, expired, reused, or for another page: solve again. */
  | { ok: false; reason: "invalid"; detail: string }
  /** Our secret is wrong or Cloudflare could not be reached: not the visitor's fault. */
  | { ok: false; reason: "unavailable"; detail: string };

/**
 * Hostnames a token may legitimately carry, from the canonical site URL: the
 * host itself and its www/apex twin (a visitor may land on either if the host
 * does not redirect one to the other).
 */
export function expectedHostnamesFor(siteUrl: string | undefined): string[] {
  if (!siteUrl?.trim()) return [];
  try {
    const host = new URL(siteUrl).hostname.toLowerCase();
    const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
    return [host, twin];
  } catch {
    return [];
  }
}

/**
 * Validates a token with Cloudflare's siteverify API, with a timeout, and
 * checks the hostname and action Cloudflare reports, as Cloudflare
 * recommends. A token is valid for 300 s and can be verified once.
 *
 * With Cloudflare's dummy secret keys (only accepted under APP_ENV=test; the
 * build refuses them in production) the hostname and action of the response
 * are not documented, so those two checks are skipped. The dummy secret only
 * accepts the dummy token, so a forged token still fails.
 *
 * The secret is read per call so a runtime change applies without a rebuild.
 */
export async function verifyTurnstile(
  token: string,
  { expectedHostnames, expectedAction, remoteip }: TurnstileCheck,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  if (!secret) {
    return { ok: false, reason: "unavailable", detail: "TURNSTILE_SECRET_KEY is not set" };
  }
  const response = token.trim();
  if (!response) return { ok: false, reason: "invalid", detail: "no token in the request" };

  const body: Record<string, string> = { secret, response };
  if (remoteip) body.remoteip = remoteip;

  let result: SiteverifyResponse;
  try {
    const res = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { ok: false, reason: "unavailable", detail: `siteverify answered HTTP ${res.status}` };
    }
    result = (await res.json()) as SiteverifyResponse;
  } catch (error) {
    const why = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { ok: false, reason: "unavailable", detail: `siteverify unreachable: ${why}` };
  }

  if (!result.success) {
    const codes = result["error-codes"] ?? [];
    const detail = `siteverify rejected the token: ${codes.join(", ") || "no error code"}`;
    if (codes.some((c) => CONFIG_ERROR_CODES.has(c))) {
      return { ok: false, reason: "unavailable", detail };
    }
    return { ok: false, reason: "invalid", detail };
  }

  if (TEST_SECRET_PATTERN.test(secret)) return { ok: true };

  if (expectedHostnames.length > 0) {
    const hostname = result.hostname?.toLowerCase() ?? "";
    if (!expectedHostnames.includes(hostname)) {
      return {
        ok: false,
        reason: "invalid",
        detail: `token was issued for hostname "${hostname || "(none)"}", expected ${expectedHostnames.join(" or ")}`,
      };
    }
  }
  if (expectedAction !== undefined && result.action !== expectedAction) {
    return {
      ok: false,
      reason: "invalid",
      detail: `token action "${result.action ?? "(none)"}" does not match "${expectedAction}"`,
    };
  }
  return { ok: true };
}
