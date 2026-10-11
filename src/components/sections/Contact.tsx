"use client";

import emailjs, { EmailJSResponseStatus } from "@emailjs/browser";
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
  emailjsConfig,
  emailjsConfigured,
  emailjsMissing,
  reportEmailjsMissing,
} from "@/lib/emailjs";
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

type CopyKey = "email" | "github" | "linkedin" | null;

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

      <div className="hidden items-baseline gap-x-3 gap-y-1 py-1.5 minimal:flex">
        {href ? (
          <a
            href={href}
            target={href.startsWith("mailto:") ? undefined : "_blank"}
            rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
            className="essay-link min-w-0 break-all text-base text-foreground"
          >
            {value}
          </a>
        ) : (
          <span className="min-w-0 break-all text-base text-foreground">
            {value}
          </span>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 text-sm text-muted underline decoration-transparent underline-offset-[0.22em] transition-colors hover:text-foreground hover:decoration-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={`${copyLabel}: ${value}`}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </>
  );
}

export function Contact() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const { mode } = useTheme();
  const { contact, social } = useSiteContent();
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyKey>(null);
  const copyTimer = useRef<number | null>(null);

  const github = social.github || socialLinks.github;
  const linkedin = social.linkedin || socialLinks.linkedin;
  const hasEmail = Boolean(contact.email);
  // CAPTCHA is required only when a site key is present; otherwise the form still works.
  const captchaReady = !turnstileConfigured || Boolean(turnstileToken);
  const canSubmit =
    emailjsConfigured && captchaReady && status !== "loading";

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
    reportEmailjsMissing();
    reportTurnstileMissing();
  }, []);

  function dismissFeedback() {
    setStatus((s) => (s === "error" || s === "success" ? "idle" : s));
    setStatusMessage(null);
  }

  function resetTurnstile() {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t("validation.required");
    else if (name.length > 200) next.name = t("validation.maxLength");
    if (!email.trim()) next.email = t("validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t("validation.email");
    if (!subject.trim()) next.subject = t("validation.required");
    else if (subject.length > 200) next.subject = t("validation.maxLength");
    if (!message.trim()) next.message = t("validation.required");
    else if (message.length > 4000) next.message = t("validation.maxLength");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function verifyTurnstile(token: string): Promise<boolean> {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      setStatus("error");
      setStatusMessage(t("captchaError"));
      resetTurnstile();
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailjsConfigured) return;
    if (!validate()) return;

    if (turnstileConfigured && !turnstileToken) {
      setStatus("error");
      setStatusMessage(t("captchaRequired"));
      return;
    }

    const form = formRef.current;
    if (!form) {
      setStatus("error");
      setStatusMessage(t("error"));
      return;
    }

    setStatus("loading");
    setStatusMessage(null);

    try {
      if (turnstileConfigured) {
        const verified = await verifyTurnstile(turnstileToken);
        if (!verified) return;
      }

      await emailjs.sendForm(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        form,
        { publicKey: emailjsConfig.publicKey },
      );

      setStatus("success");
      setStatusMessage(t("success"));
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrors({});
      form.reset();
      resetTurnstile();
    } catch (err) {
      setStatus("error");
      setStatusMessage(t("error"));
      resetTurnstile();
      if (err instanceof EmailJSResponseStatus) {
        console.error("EmailJS:", err.status, err.text);
      } else {
        console.error(err);
      }
    }
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
        value={github.replace(/^https?:\/\//, "")}
        href={github}
        copied={copied === "github"}
        copyLabel={t("copy")}
        copiedLabel={t("copied")}
        onCopy={() => handleCopy("github", github)}
      />
      <CopyableLine
        label="linkedin"
        value={linkedin.replace(/^https?:\/\//, "")}
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
          <p className="hidden text-base text-muted minimal:block">
            {contact.location}
          </p>
        </>
      )}
    </>
  );

  const fieldClass =
    "w-full rounded-sm border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-1 focus:ring-accent/40 minimal:rounded-none minimal:border-0 minimal:border-b minimal:border-border minimal:bg-transparent minimal:px-0 minimal:py-2.5 minimal:font-body minimal:text-base minimal:focus:border-foreground minimal:focus:ring-0";

  const labelClass =
    "font-mono text-[11px] tracking-wide text-muted minimal:font-body minimal:text-sm";

  const turnstileTheme =
    mode === "light" ? "light" : mode === "dark" ? "dark" : "auto";

  return (
    <Section id="contact" className="py-16 sm:py-28">
      <div className="mx-auto min-w-0 max-w-content px-4 sm:px-6 lg:px-8 minimal:max-w-content-prose minimal:px-5 sm:minimal:px-6">
        <div className="max-w-2xl minimal:max-w-none">
          <p className="decor font-mono text-xs tracking-wide text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight break-words text-foreground sm:text-4xl minimal:mt-0 minimal:text-3xl minimal:font-normal">
            {t("title")}
          </h2>
          <p className="mt-3 max-w-md text-left text-sm leading-relaxed break-words text-muted minimal:mt-5 minimal:max-w-none minimal:text-base">
            {t("subtitle")}
          </p>
          {!hasEmail && (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted minimal:max-w-none minimal:text-base">
              {t("noEmailLine")}
            </p>
          )}
        </div>

        <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start minimal:mt-12 minimal:block">
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
            className="min-w-0 border border-border bg-surface p-5 sm:p-6 minimal:mt-12 minimal:border-0 minimal:bg-transparent minimal:p-0"
            noValidate
          >
            <p className="decor font-mono text-[11px] tracking-wide text-muted">
              <span>{"// "}</span>
              {t("formHeading")}
            </p>
            <p className="hidden font-heading text-xl font-normal tracking-tight text-foreground minimal:block">
              {t("formHeading")}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 minimal:mt-5 minimal:gap-5">
              <label className="flex flex-col gap-1.5 text-sm minimal:gap-1">
                <span className={labelClass}>{t("name")}</span>
                <input
                  name="from_name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    dismissFeedback();
                    setName(e.target.value);
                  }}
                  placeholder={t("placeholders.name")}
                  autoComplete="name"
                  required
                  maxLength={200}
                  className={fieldClass}
                />
                {errors.name && (
                  <span className="font-mono text-xs text-danger minimal:font-body">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5 text-sm minimal:gap-1">
                <span className={labelClass}>{t("email")}</span>
                <input
                  name="reply_to"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    dismissFeedback();
                    setEmail(e.target.value);
                  }}
                  placeholder={t("placeholders.email")}
                  autoComplete="email"
                  required
                  maxLength={254}
                  className={fieldClass}
                />
                {errors.email && (
                  <span className="font-mono text-xs text-danger minimal:font-body">
                    {errors.email}
                  </span>
                )}
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-1.5 text-sm minimal:mt-5 minimal:gap-1">
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
                maxLength={200}
                className={fieldClass}
              />
              {errors.subject && (
                <span className="font-mono text-xs text-danger minimal:font-body">
                  {errors.subject}
                </span>
              )}
            </label>

            <label className="mt-4 flex flex-col gap-1.5 text-sm minimal:mt-5 minimal:gap-1">
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
                maxLength={4000}
                className={`${fieldClass} resize-y`}
              />
              {errors.message && (
                <span className="font-mono text-xs text-danger minimal:font-body">
                  {errors.message}
                </span>
              )}
            </label>

            {turnstileConfigured ? (
              <div className="mt-5 overflow-x-auto">
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
                    setStatusMessage(t("captchaError"));
                  }}
                  options={{
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

            {!emailjsConfigured && process.env.NODE_ENV !== "production" && (
              <p className="mt-4 font-mono text-xs text-warning minimal:font-body">
                [DEV] Contact form disabled. Set {emailjsMissing.join(", ")} in
                .env.local.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4 minimal:mt-6 minimal:pt-1">
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
                className="essay-link hidden text-base text-foreground disabled:opacity-50 minimal:inline"
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
              {status === "success" && statusMessage && (
                <span
                  role="status"
                  className="font-mono text-xs text-accent minimal:font-body minimal:text-sm minimal:text-muted"
                >
                  {statusMessage}
                </span>
              )}
              {status === "error" && statusMessage && (
                <span
                  role="alert"
                  className="font-mono text-xs text-danger minimal:font-body minimal:text-sm"
                >
                  {statusMessage}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </Section>
  );
}
