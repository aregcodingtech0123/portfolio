// Reads the EmailJS private key. The build fails if a Client Component graph
// imports this file.
import "server-only";
import { stripMailHeaderInjection } from "@/lib/mailto";
import type { ContactFields } from "@/lib/contact/rules";

/**
 * Sends the contact email from the server through EmailJS's REST API
 * (POST /api/v1.0/email/send), the same call @emailjs/browser makes, plus the
 * account's private key as `accessToken`.
 *
 * Why REST and not an SDK: @emailjs/browser cannot run here (it reads
 * `location` and `navigator`, and has no private-key parameter), and
 * @emailjs/nodejs is a thin wrapper around this one request. A fetch keeps the
 * dependency count at zero.
 *
 * The same EmailJS template keeps working: the parameters are the names the
 * old form fields had (from_name, reply_to, subject, message).
 *
 * Two EmailJS dashboard settings (Account, Security) are what make this a
 * real boundary, and code cannot set them:
 * - "Allow EmailJS API for non-browser applications" must be ON, or every
 *   server call is refused with 403.
 * - "Use Private Key" must be ON, or anyone holding the public key and the
 *   ids could still send without going through this route.
 */

export const EMAILJS_DEFAULT_ORIGIN = "https://api.emailjs.com";
const SEND_PATH = "/api/v1.0/email/send";
const TIMEOUT_MS = 10_000;

export const EMAILJS_ENV_VARS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_TEMPLATE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
] as const;

export type EmailjsConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
  origin: string;
};

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Where to send. Always the real EmailJS API, except under APP_ENV=test when
 * EMAILJS_API_ORIGIN points at a local mock (the Playwright run): an override
 * that could redirect real mail elsewhere must not exist in production.
 */
export function resolveEmailjsOrigin(env: Env): string {
  const override = env.EMAILJS_API_ORIGIN?.trim();
  if (!override || env.APP_ENV?.trim().toLowerCase() !== "test") return EMAILJS_DEFAULT_ORIGIN;
  try {
    const url = new URL(override);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (local && (url.protocol === "http:" || url.protocol === "https:")) return url.origin;
  } catch {
    // fall through
  }
  return EMAILJS_DEFAULT_ORIGIN;
}

/**
 * The configuration from the runtime environment, or null when any of the
 * four values is missing. Read per call, so a host's runtime variables apply
 * without a rebuild.
 */
export function readEmailjsConfig(): EmailjsConfig | null {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim() ?? "";
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim() ?? "";
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim() ?? "";
  if (!serviceId || !templateId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey, origin: resolveEmailjsOrigin(process.env) };
}

export type SendResult =
  | { ok: true }
  /** Refused for a reason retrying will not fix: keys, settings, template, quota. */
  | { ok: false; kind: "misconfigured"; detail: string }
  /** Rate limit, provider error, timeout, network: worth retrying later. */
  | { ok: false; kind: "transient"; detail: string };

export async function sendContactEmail(
  fields: ContactFields,
  config: EmailjsConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  const body = {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    accessToken: config.privateKey,
    template_params: {
      // Single-line values: no CR/LF that could smuggle a mail header.
      from_name: stripMailHeaderInjection(fields.name).trim(),
      reply_to: stripMailHeaderInjection(fields.email).trim(),
      subject: stripMailHeaderInjection(fields.subject).trim(),
      message: fields.message.trim(),
    },
  };

  let response: Response;
  try {
    response = await fetchImpl(`${config.origin}${SEND_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { ok: false, kind: "transient", detail: `EmailJS request failed: ${reason}` };
  }

  if (response.ok) return { ok: true };

  const text = (await response.text().catch(() => "")).slice(0, 300);
  const detail = `EmailJS answered ${response.status}: ${text || "(no body)"}`;
  // 429 is the provider's rate limit and 5xx its own failure: try again later.
  // Every other 4xx (bad key, private key required, non-browser calls
  // disabled, unknown template or service, monthly quota used up) stays broken
  // until the owner changes something.
  if (response.status === 429 || response.status >= 500) {
    return { ok: false, kind: "transient", detail };
  }
  return { ok: false, kind: "misconfigured", detail };
}
