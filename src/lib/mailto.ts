const MAX_SUBJECT = 200;
const MAX_BODY = 4000;

/** Strip characters that can smuggle extra mail headers in some mail clients. */
export function stripMailHeaderInjection(value: string): string {
  return value.replace(/[\r\n\x00]/g, " ");
}

export function isValidMailbox(recipient: string): boolean {
  const t = recipient.trim();
  if (t.length > 254 || /\s/.test(t) || /[<>"'`]/.test(t)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function isSafeExternalHref(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Build a mailto URL with RFC 6068–friendly encoding. Returns null if recipient is unsafe.
 */
export function buildMailtoHref(
  recipient: string,
  subject: string,
  body: string,
): string | null {
  if (!isValidMailbox(recipient)) return null;
  const sub = stripMailHeaderInjection(subject).trim().slice(0, MAX_SUBJECT);
  const bod = stripMailHeaderInjection(body).trim().slice(0, MAX_BODY);
  const params = new URLSearchParams();
  params.set("subject", sub);
  params.set("body", bod);
  return `mailto:${recipient.trim()}?${params.toString()}`;
}
