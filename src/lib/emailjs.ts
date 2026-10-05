/**
 * EmailJS settings for the contact form. The NEXT_PUBLIC_* values are inlined at build time,
 * so each variable must be referenced literally below.
 */
export const emailjsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "",
};

export const emailjsMissing = (
  Object.entries({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: emailjsConfig.serviceId,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: emailjsConfig.templateId,
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: emailjsConfig.publicKey,
  })
    .filter(([, value]) => !value.trim())
    .map(([name]) => name)
);

/** True only when all three variables are set. The form stays disabled otherwise. */
export const emailjsConfigured = emailjsMissing.length === 0;

/** Logs once per page load in development, and always in the browser console when unset. */
export function reportEmailjsMissing() {
  if (emailjsConfigured) return;
  console.error(
    `[Contact] EmailJS is not configured. Missing: ${emailjsMissing.join(", ")}. The contact form is disabled.`,
  );
}
