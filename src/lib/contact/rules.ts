/**
 * The contact form's contract, shared by the browser (Contact.tsx) and the
 * server (/api/contact) so the two cannot disagree. Pure: no environment, no
 * secrets, safe to import anywhere.
 *
 * The browser checks the same rules for instant feedback; the server checks
 * them again because the browser's checks are a convenience, not a boundary.
 */

export const CONTACT_LIMITS = {
  name: 200,
  email: 254,
  subject: 200,
  message: 4000,
  /** A Turnstile token is ~2 KB at most. */
  token: 4096,
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Honeypot: a field no person sees or reaches (off-screen, aria-hidden, not
 * focusable, autocomplete off). A bot that fills every input fills this one.
 * The name avoids the words browsers autofill on (name, email, url, website),
 * so a password manager does not fill it for a real visitor.
 */
export const HONEYPOT_FIELD = "fax_extension";

/**
 * Nobody types a name, an address, a subject and a message in under three
 * seconds. The browser reports how long the form was open; it can be faked,
 * so this is friction for naive bots, not a defence.
 */
export const MIN_FILL_MS = 3000;

/** Turnstile action name, set on the widget and checked on the server. */
export const TURNSTILE_ACTION = "contact";

/**
 * Every answer /api/contact gives. The browser maps each to a message; none
 * of them carries detail about the server.
 * - sent: the email left the server.
 * - invalid: a field failed the server's checks (the browser checks first,
 *   so a person rarely sees this).
 * - rejected: honeypot filled or the form was sent implausibly fast.
 * - captcha_failed: the Turnstile token did not verify; solve it again.
 * - send_failed: the provider refused or did not answer; worth retrying.
 * - unavailable: the server is misconfigured or a dependency is down; the
 *   visitor is pointed at another way to reach the owner instead of retrying.
 */
export type ContactOutcome =
  | "sent"
  | "invalid"
  | "rejected"
  | "captcha_failed"
  | "send_failed"
  | "unavailable";

export type ContactFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactPayload = ContactFields & {
  token: string;
  [HONEYPOT_FIELD]: string;
  elapsedMs: number;
};

export type FieldError = "required" | "maxLength" | "email";

/** Same rules the browser shows inline. Trims before checking emptiness. */
export function validateFields(fields: ContactFields): Partial<Record<keyof ContactFields, FieldError>> {
  const errors: Partial<Record<keyof ContactFields, FieldError>> = {};
  for (const key of ["name", "email", "subject", "message"] as const) {
    const value = fields[key];
    if (!value.trim()) errors[key] = "required";
    else if (value.length > CONTACT_LIMITS[key]) errors[key] = "maxLength";
  }
  if (!errors.email && !EMAIL_PATTERN.test(fields.email.trim())) errors.email = "email";
  return errors;
}

export type ParsedPayload =
  | { ok: true; fields: ContactFields; token: string; honeypot: string; elapsedMs: number }
  | { ok: false; reason: "invalid" };

/**
 * Turns an untrusted JSON value into a typed payload, or says it is invalid.
 * Wrong types, missing fields and over-long values are all "invalid"; the
 * caller does not learn which, and neither does the client.
 */
export function parseContactPayload(raw: unknown): ParsedPayload {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "invalid" };
  const body = raw as Record<string, unknown>;

  const strings = ["name", "email", "subject", "message", "token"] as const;
  for (const key of strings) {
    if (typeof body[key] !== "string") return { ok: false, reason: "invalid" };
  }
  const honeypot = body[HONEYPOT_FIELD] ?? "";
  if (typeof honeypot !== "string") return { ok: false, reason: "invalid" };
  const elapsedMs = body.elapsedMs;
  if (typeof elapsedMs !== "number" || !Number.isFinite(elapsedMs)) return { ok: false, reason: "invalid" };

  const fields: ContactFields = {
    name: body.name as string,
    email: (body.email as string).trim(),
    subject: body.subject as string,
    message: body.message as string,
  };
  if (Object.keys(validateFields(fields)).length > 0) return { ok: false, reason: "invalid" };

  const token = (body.token as string).trim();
  if (token.length > CONTACT_LIMITS.token) return { ok: false, reason: "invalid" };

  return { ok: true, fields, token, honeypot, elapsedMs };
}
