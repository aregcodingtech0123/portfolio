"use client";

import {
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { buttonClasses } from "@/components/ui/Button";
import { isValidMailbox } from "@/lib/mailto";
import {
  CONTACT_SEND_VARS,
  contactSendConfigured,
  reportContactSendMissing,
} from "@/lib/contact/client-config";
import {
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  TURNSTILE_ACTION,
  validateFields,
  type ContactOutcome,
} from "@/lib/contact/rules";
import {
  reportTurnstileMissing,
  turnstileConfigured,
  turnstileSiteKey,
} from "@/lib/turnstile";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { socialLinks } from "@/components/ui/SocialIcons";

type FieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

type SubmitStatus = "idle" | "loading" | "success" | "error";

/** Why the last attempt did not send: one of the server's answers, or the captcha not done yet. */
type Notice = Exclude<ContactOutcome, "sent"> | "captchaRequired";

const OUTCOMES: readonly ContactOutcome[] = [
  "sent",
  "invalid",
  "rejected",
  "captcha_failed",
  "send_failed",
  "unavailable",
];

/**
 * The server's answer. A body that is not one of the known outcomes (a proxy
 * error page, a crash) is not trusted: 503 means unavailable, anything else
 * is a failed send worth retrying.
 */
async function readOutcome(res: Response): Promise<ContactOutcome> {
  try {
    const body = (await res.json()) as { outcome?: unknown };
    const outcome = body?.outcome as ContactOutcome;
    if (OUTCOMES.includes(outcome) && (outcome !== "sent" || res.ok)) return outcome;
  } catch {
    // not JSON
  }
  return res.status === 503 ? "unavailable" : "send_failed";
}

type CopyKey = "email" | "github" | "linkedin" | null;

/** Host + path for display: decode percent-escapes, drop the protocol and trailing slash. */
function displaySocialUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, "");
    const path = decodeURIComponent(parsed.pathname).replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    try {
      return decodeURIComponent(url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    } catch {
      return url.replace(/^https?:\/\//, "");
    }
  }
}

function CopyableLine({
  label,
  value,
  href,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  label: string;
  value: string;
  href?: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
}) {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 minimal:hidden">
        <span className="w-24 shrink-0 font-mono text-[11px] text-accent">
          {label}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {href ? (
            <a
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                href.startsWith("mailto:") ? undefined : "noopener noreferrer"
              }
              className="min-w-0 truncate font-mono text-sm text-foreground underline-offset-2 hover:text-accent hover:underline"
            >
              {value}
            </a>
          ) : (
            <span className="min-w-0 truncate font-mono text-sm text-foreground">
              {value}
            </span>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="ml-auto shrink-0 rounded-sm border border-border px-2 py-1 font-mono text-[10px] tracking-wide text-muted transition-colors hover:border-accent hover:text-accent"
            aria-label={`${copyLabel}: ${value}`}
          >
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      </div>

      <div className="hidden min-w-0 py-3 minimal:block">
        <p className="m-meta">{label}</p>
        <div className="mt-2 flex min-w-0 items-center gap-3">
          {href ? (
            <a
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                href.startsWith("mailto:") ? undefined : "noopener noreferrer"
              }
              className="m-contact-link m-wipe min-w-0 flex-1 truncate"
            >
              {value}
            </a>
          ) : (
            <span className="m-contact-link min-w-0 flex-1 truncate">{value}</span>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="m-copy shrink-0"
            aria-label={`${copyLabel}: ${value}`}
          >
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      </div>
    </>
  );
}

/** The Terminal skin label, e.g. "// 03 projects", numbered and translated by the page. */
export function Contact({ sectionLabel }: { sectionLabel: string }) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const { mode } = useTheme();
  const { contact, social } = useSiteContent();
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  // When the form became usable. The server refuses a submission that comes
  // implausibly fast (MIN_FILL_MS); this is cheap friction for naive bots.
  const openedAt = useRef(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [copied, setCopied] = useState<CopyKey>(null);
  const copyTimer = useRef<number | null>(null);

  const github = social.github || socialLinks.github;
  const linkedin = social.linkedin || socialLinks.linkedin;
  const hasEmail = Boolean(contact.email);
  const mailtoHref = hasEmail && isValidMailbox(contact.email) ? `mailto:${contact.email.trim()}` : undefined;
  // The server requires the captcha in production, so a production build
  // without a site key cannot accept a submission; development without keys can.
  const formAvailable =
    contactSendConfigured &&
    (turnstileConfigured || process.env.NODE_ENV !== "production");
  // Shown instead of a form that cannot work: up front when the build already
  // knows, or after the server answers "unavailable". No retry loop either way.
  const unavailable = !formAvailable || notice === "unavailable";
  const captchaReady = !turnstileConfigured || Boolean(turnstileToken);
  const canSubmit = !unavailable && captchaReady && status !== "loading";

  const handleCopy = useCallback(
    async (key: Exclude<CopyKey, null>, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        if (copyTimer.current) window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(null), 1600);
      } catch {
        setCopied(null);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    openedAt.current = performance.now();
    reportContactSendMissing();
    reportTurnstileMissing();
  }, []);

  function dismissFeedback() {
    setStatus((s) => (s === "error" || s === "success" ? "idle" : s));
    // "unavailable" stays: editing a field does not make the server work.
    setNotice((n) => (n === "unavailable" ? n : null));
  }

  function noticeText(n: Notice): string {
    switch (n) {
      case "captchaRequired":
        return t("captchaRequired");
      case "captcha_failed":
        return t("captchaError");
      case "rejected":
        return t("rejected");
      case "invalid":
        return t("invalid");
      case "send_failed":
        return t("sendFailed");
      case "unavailable":
        return t("unavailable");
    }
  }

  function resetTurnstile() {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  function validate(): boolean {
    const found = validateFields({ name, email, subject, message });
    const next: FieldErrors = {};
    for (const [key, error] of Object.entries(found) as [keyof FieldErrors, string][]) {
      next[key] =
        error === "required"
          ? t("validation.required")
          : error === "email"
            ? t("validation.email")
            : t("validation.maxLength");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /**
   * The browser's only part in sending: post the form and the Turnstile token
   * to /api/contact. The server verifies the token and sends the email; no
   * email credential exists in this file or in the page.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (unavailable) return;
    if (!validate()) return;

    if (turnstileConfigured && !turnstileToken) {
      setStatus("error");
      setNotice("captchaRequired");
      return;
    }

    setStatus("loading");
    setNotice(null);

    let outcome: ContactOutcome;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          token: turnstileToken,
          [HONEYPOT_FIELD]: honeypot,
          elapsedMs: Math.round(performance.now() - openedAt.current),
        }),
      });
      outcome = await readOutcome(res);
    } catch {
      // Offline, or the request never reached the server.
      outcome = "send_failed";
    }

    // A Turnstile token is single-use: whatever happened, this one is spent.
    resetTurnstile();

    if (outcome === "sent") {
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrors({});
      formRef.current?.reset();
      return;
    }
    setStatus("error");
    setNotice(outcome);
  }

  const contactLines = (
    <>
      {contact.email && (
        <CopyableLine
          label="email"
          value={contact.email}
          href={
            isValidMailbox(contact.email)
              ? `mailto:${contact.email.trim()}`
              : undefined
          }
          copied={copied === "email"}
          copyLabel={t("copy")}
          copiedLabel={t("copied")}
          onCopy={() => handleCopy("email", contact.email)}
        />
      )}
      <CopyableLine
        label="github"
        value={displaySocialUrl(github)}
        href={github}
        copied={copied === "github"}
        copyLabel={t("copy")}
        copiedLabel={t("copied")}
        onCopy={() => handleCopy("github", github)}
      />
      <CopyableLine
        label="linkedin"
        value={displaySocialUrl(linkedin)}
        href={linkedin}
        copied={copied === "linkedin"}
        copyLabel={t("copy")}
        copiedLabel={t("copied")}
        onCopy={() => handleCopy("linkedin", linkedin)}
      />
      {contact.location && (
        <>
          <div className="flex min-w-0 flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4 minimal:hidden">
            <span className="w-24 shrink-0 font-mono text-[11px] text-accent">
              location
            </span>
            <span className="font-mono text-sm text-muted">
              {contact.location}
            </span>
          </div>
          <p className="m-meta mt-4 hidden minimal:block">
            {contact.location}
          </p>
        </>
      )}
    </>
  );

  const fieldClass =
    "w-full rounded-sm border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-1 focus:ring-accent/40 m-field";

  const labelClass =
    "font-mono text-[11px] tracking-wide text-muted m-meta";

  const turnstileTheme =
    mode === "light" ? "light" : mode === "dark" ? "dark" : "auto";

  return (
    <Section
      id="contact"
      className="py-16 sm:py-28 minimal:mb-[var(--space-group)] minimal:pb-[var(--space-section)]"
    >
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 m-container">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {sectionLabel}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight break-words text-foreground sm:text-4xl minimal:hidden">
            {t("title")}
          </h2>
          <h2 className="m-h2 hidden min-w-0 hyphens-manual minimal:block">
            {t("heading")}
          </h2>
          <p className="mt-3 max-w-md text-left text-sm leading-relaxed break-words text-muted minimal:mt-5 minimal:max-w-xl minimal:text-lg m-lead">
            {t("subtitle")}
          </p>
        </div>

        <div className="m-contact-grid mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start minimal:mt-[var(--space-group)] lg:minimal:gap-16">
          <div className="min-w-0 overflow-hidden rounded-md border border-border bg-surface minimal:overflow-visible minimal:rounded-none minimal:border-0 minimal:bg-transparent">
            <div className="decor flex items-center gap-1.5 border-b border-border px-3 py-2">
              <span className="h-2 w-2 rounded-sm bg-danger" aria-hidden />
              <span className="h-2 w-2 rounded-sm bg-warning" aria-hidden />
              <span className="h-2 w-2 rounded-sm bg-accent" aria-hidden />
              <span className="ml-2 font-mono text-[10px] tracking-wide text-muted">
                ~/contact
              </span>
            </div>
            <div className="bg-background/80 px-3 py-1 sm:px-4 minimal:bg-transparent minimal:px-0 minimal:py-0">
              <p className="decor border-b border-border py-3 font-mono text-xs text-muted">
                $ cat contact.txt
              </p>
              {contactLines}
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="min-w-0 border border-border bg-surface p-5 sm:p-6 minimal:mt-0 minimal:border-0 minimal:bg-transparent minimal:p-0"
            noValidate
          >
            <p className="decor font-mono text-[11px] tracking-wide text-muted">
              <span>{"// "}</span>
              {t("formHeading")}
            </p>
            <p className="m-h3 hidden tracking-tight text-foreground minimal:block">
              {t("formHeading")}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 minimal:mt-8 minimal:gap-6">
              <label className="flex flex-col gap-1.5 text-sm minimal:gap-2">
                <span className={labelClass}>{t("name")}</span>
                <input
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    dismissFeedback();
                    setName(e.target.value);
                  }}
                  placeholder={t("placeholders.name")}
                  autoComplete="name"
                  required
                  maxLength={CONTACT_LIMITS.name}
                  className={fieldClass}
                />
                {errors.name && (
                  <span className="font-mono text-xs text-danger m-error">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5 text-sm minimal:gap-2">
                <span className={labelClass}>{t("email")}</span>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    dismissFeedback();
                    setEmail(e.target.value);
                  }}
                  placeholder={t("placeholders.email")}
                  autoComplete="email"
                  required
                  maxLength={CONTACT_LIMITS.email}
                  className={fieldClass}
                />
                {errors.email && (
                  <span className="font-mono text-xs text-danger m-error">
                    {errors.email}
                  </span>
                )}
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1.5 text-sm minimal:mt-6 minimal:gap-2">
              <span className={labelClass}>{t("subject")}</span>
              <input
                name="subject"
                type="text"
                value={subject}
                onChange={(e) => {
                  dismissFeedback();
                  setSubject(e.target.value);
                }}
                placeholder={t("placeholders.subject")}
                required
                maxLength={CONTACT_LIMITS.subject}
                className={fieldClass}
              />
              {errors.subject && (
                <span className="font-mono text-xs text-danger m-error">
                  {errors.subject}
                </span>
              )}
            </label>

            <label className="mt-4 flex flex-col gap-1.5 text-sm minimal:mt-6 minimal:gap-2">
              <span className={labelClass}>{t("message")}</span>
              <textarea
                name="message"
                value={message}
                onChange={(e) => {
                  dismissFeedback();
                  setMessage(e.target.value);
                }}
                placeholder={t("placeholders.message")}
                required
                rows={4}
                maxLength={CONTACT_LIMITS.message}
                className={`${fieldClass} resize-y`}
              />
              {errors.message && (
                <span className="font-mono text-xs text-danger m-error">
                  {errors.message}
                </span>
              )}
            </label>

            {/* Honeypot. Off-screen, inert, hidden from assistive technology and
                out of the tab order: no person reaches it, a form-filling bot
                does. The server refuses the message if it is not empty. */}
            <div
              aria-hidden="true"
              inert
              className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
            >
              <label>
                {t("honeypotLabel")}
                <input
                  type="text"
                  name={HONEYPOT_FIELD}
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            {turnstileConfigured ? (
              <div className="mt-5 overflow-x-auto minimal:mt-8">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => {
                    dismissFeedback();
                    setTurnstileToken(token);
                  }}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => {
                    setTurnstileToken("");
                    setStatus("error");
                    setNotice("captcha_failed");
                  }}
                  options={{
                    action: TURNSTILE_ACTION,
                    theme: turnstileTheme,
                    size: "flexible",
                    language: locale.startsWith("tr") ? "tr" : "en",
                    responseField: false,
                  }}
                />
              </div>
            ) : (
              process.env.NODE_ENV !== "production" && (
                <p className="mt-4 font-mono text-xs text-warning minimal:font-body">
                  [DEV] Turnstile disabled. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY
                  and TURNSTILE_SECRET_KEY in .env.local.
                </p>
              )
            )}

            {!contactSendConfigured && process.env.NODE_ENV !== "production" && (
              <p className="mt-4 font-mono text-xs text-warning minimal:font-body">
                [DEV] Contact form disabled: the server cannot send. Set{" "}
                {CONTACT_SEND_VARS.join(", ")} (server-only) in .env.local.
              </p>
            )}

            {unavailable && (
              <div
                role={notice === "unavailable" ? "alert" : undefined}
                className="mt-5 border border-border bg-background/60 p-4 text-sm leading-relaxed text-foreground m-notice"
              >
                <p>{t("unavailable")}</p>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {mailtoHref && (
                    <li>
                      <a href={mailtoHref} className="essay-link font-mono text-sm minimal:font-body minimal:text-base">
                        {contact.email.trim()}
                      </a>
                    </li>
                  )}
                  <li>
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="essay-link font-mono text-sm minimal:font-body minimal:text-base"
                    >
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4 minimal:mt-8 minimal:flex-col minimal:items-stretch sm:minimal:flex-row sm:minimal:items-center">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`${buttonClasses("primary", "min-w-[160px] px-6")} minimal:hidden`}
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("sending")}
                  </span>
                ) : (
                  t("send")
                )}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="m-btn m-btn-primary hidden min-w-[12rem] disabled:cursor-not-allowed minimal:inline-flex"
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("sending")}
                  </span>
                ) : (
                  t("send")
                )}
              </button>
              {status === "success" && (
                <span role="status" className="font-mono text-xs text-accent m-success">
                  {t("success")}
                </span>
              )}
              {status === "error" && notice && notice !== "unavailable" && (
                <span
                  role="alert"
                  className="font-mono text-xs text-danger m-error"
                >
                  {noticeText(notice)}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </Section>
  );
}
