/**
 * What the browser knows about the contact form's server side: one boolean,
 * baked in at build time by next.config.ts (CONTACT_SEND_CONFIGURED). The
 * EmailJS credentials themselves are server-only (src/lib/contact/
 * email-transport.ts); the browser never sends mail.
 *
 * When the server cannot send, the form says so up front ("unavailable, reach
 * me here") instead of letting a visitor fill it in for nothing. The route
 * still answers "unavailable" at submit if the runtime environment differs
 * from the build's.
 */
export const contactSendConfigured = process.env.CONTACT_SEND_CONFIGURED === "1";

/** For the development notice only. */
export const CONTACT_SEND_VARS = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_TEMPLATE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
] as const;

/** Dev-only hint; uses warn so Next.js does not surface a console-error overlay. */
export function reportContactSendMissing() {
  if (contactSendConfigured || process.env.NODE_ENV === "production") return;
  console.warn(
    `[Contact] The server cannot send the contact email. Set ${CONTACT_SEND_VARS.join(", ")} (server-only, in .env.local). The form shows "unavailable" until then.`,
  );
}
