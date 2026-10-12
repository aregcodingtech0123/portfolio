import { NextResponse } from "next/server";
import {
  MIN_FILL_MS,
  TURNSTILE_ACTION,
  parseContactPayload,
  type ContactOutcome,
} from "@/lib/contact/rules";
import { readEmailjsConfig, sendContactEmail } from "@/lib/contact/email-transport";
import { isJsonContentType, readLimitedBody } from "@/lib/request-body";
import { expectedHostnamesFor, isTurnstileSecretSet, verifyTurnstile } from "@/lib/turnstile-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The fields are capped at 200 + 254 + 200 + 4,000 characters plus a token of
 * at most 4 KB; even if every character were JSON-escaped (6 bytes) that is
 * under 64 KB. Anything bigger is not a real submission.
 */
const MAX_BODY_BYTES = 64 * 1024;

const STATUS: Record<ContactOutcome, number> = {
  sent: 200,
  invalid: 400,
  captcha_failed: 403,
  rejected: 422,
  send_failed: 502,
  unavailable: 503,
};

function respond(outcome: ContactOutcome, status = STATUS[outcome]) {
  return NextResponse.json(
    { outcome },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Server-side detail for the owner. Never includes the visitor's message or address. */
function log(level: "error" | "warn" | "info", outcome: ContactOutcome, detail: string) {
  console[level](`[api/contact] ${outcome}: ${detail}`);
}

/**
 * The contact form's only send path.
 *
 * POST /api/contact
 * Body (application/json): { name, email, subject, message, token,
 *   fax_extension (honeypot, empty), elapsedMs }
 * Response: { outcome } with one of the statuses in STATUS.
 *
 * Order, cheapest first: content type, size, shape and field rules, honeypot
 * and fill time, configuration, Turnstile, then the send. The email leaves
 * the server only after Turnstile has verified the token, so the captcha is a
 * real gate: the browser never holds an email credential.
 *
 * Every refusal is visible to the visitor (the client maps each outcome to a
 * message) and logged here with the reason. A misconfigured server answers
 * "unavailable", which the visitor sees as "use my email instead", not as a
 * captcha error to retry forever.
 */
export async function POST(request: Request) {
  if (!isJsonContentType(request)) return respond("invalid", 415);

  const raw = await readLimitedBody(request, MAX_BODY_BYTES);
  if (!raw.ok) return respond("invalid", raw.status);

  let json: unknown;
  try {
    json = JSON.parse(raw.text);
  } catch {
    return respond("invalid");
  }

  const payload = parseContactPayload(json);
  if (!payload.ok) return respond("invalid");

  // Cheap spam friction. Both are visible refusals, not fake successes: a
  // real person who somehow trips one must not believe a message was sent.
  if (payload.honeypot.trim() !== "") {
    log("warn", "rejected", "honeypot field was filled");
    return respond("rejected");
  }
  if (payload.elapsedMs < MIN_FILL_MS) {
    log("warn", "rejected", `form sent ${Math.round(payload.elapsedMs)} ms after it opened (minimum ${MIN_FILL_MS} ms)`);
    return respond("rejected");
  }

  // Configuration. Checked before Turnstile so a token is not spent on a
  // request that cannot be delivered.
  const email = readEmailjsConfig();
  if (!email) {
    log("error", "unavailable", "EmailJS is not configured on the server (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY). Every submission is refused until they are set.");
    return respond("unavailable");
  }

  const production = process.env.NODE_ENV === "production";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  // Required in production, and wherever either half is set. Only a
  // development setup with neither key skips it.
  const turnstileRequired = production || siteKey !== "" || isTurnstileSecretSet();

  if (turnstileRequired) {
    if (!siteKey) {
      log("error", "unavailable", "NEXT_PUBLIC_TURNSTILE_SITE_KEY was not set when this build was made, so the page shows no captcha and no submission can pass. Rebuild with it set.");
      return respond("unavailable");
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const remoteip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;

    const verdict = await verifyTurnstile(payload.token, {
      expectedHostnames: expectedHostnamesFor(process.env.NEXT_PUBLIC_SITE_URL),
      expectedAction: TURNSTILE_ACTION,
      remoteip,
    });
    if (!verdict.ok) {
      if (verdict.reason === "unavailable") {
        log("error", "unavailable", `Turnstile verification could not run: ${verdict.detail}`);
        return respond("unavailable");
      }
      log("warn", "captcha_failed", verdict.detail);
      return respond("captcha_failed");
    }
  }

  const result = await sendContactEmail(payload.fields, email);
  if (result.ok) {
    log("info", "sent", "contact email accepted by EmailJS");
    return respond("sent");
  }
  if (result.kind === "misconfigured") {
    log("error", "unavailable", `${result.detail}. Check the EmailJS keys, the template and the Account > Security settings.`);
    return respond("unavailable");
  }
  log("error", "send_failed", result.detail);
  return respond("send_failed");
}
