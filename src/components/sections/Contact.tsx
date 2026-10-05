"use client";

import emailjs, { EmailJSResponseStatus } from "@emailjs/browser";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { buttonClasses } from "@/components/ui/Button";
import { SocialExternalLinks } from "@/components/ui/SocialIcons";
import { isValidMailbox } from "@/lib/mailto";
import {
  emailjsConfig,
  emailjsConfigured,
  emailjsMissing,
  reportEmailjsMissing,
} from "@/lib/emailjs";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

type FieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;


type SubmitStatus = "idle" | "loading" | "success" | "error";

export function Contact() {
  const t = useTranslations("Contact");
  const s = useTranslations("Social");
  const { contact } = useSiteContent();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  function dismissFeedback() {
    setStatus((s) => (s === "error" || s === "success" ? "idle" : s));
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

  useEffect(() => {
    reportEmailjsMissing();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailjsConfigured) return;
    if (!validate()) return;

    const form = formRef.current;
    if (!form) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      await emailjs.sendForm(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        form,
        { publicKey: emailjsConfig.publicKey },
      );
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrors({});
      form.reset();
    } catch (err) {
      setStatus("error");
      if (err instanceof EmailJSResponseStatus) {
        console.error("EmailJS:", err.status, err.text);
      } else {
        console.error(err);
      }
    }
  }

  return (
    <Section id="contact" className="py-16 sm:py-28">
      <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="min-w-0">
            <h2 className="text-3xl font-bold tracking-tight break-words text-foreground  sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed break-words text-muted ">
              {t("subtitle")}
            </p>
            <dl className="mt-10 space-y-6 text-sm">
              {contact.email && (
              <div>
                <dt className="font-semibold uppercase tracking-wider text-muted">
                  {t("social.emailLabel")}
                </dt>
                <dd className="mt-1">
                  {isValidMailbox(contact.email) ? (
                    <a
                      href={`mailto:${contact.email.trim()}`}
                      className="text-accent transition hover:text-accent  "
                    >
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-muted ">
                      {contact.email}
                    </span>
                  )}
                </dd>
              </div>
              )}
              <div>
                <dt className="font-semibold uppercase tracking-wider text-muted">
                  {t("social.locationLabel")}
                </dt>
                <dd className="mt-1 text-foreground ">
                  {contact.location}
                </dd>
              </div>
            </dl>
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
                {t("social.profiles")}
              </p>
              <SocialExternalLinks
                ariaGithub={s("githubAria")}
                ariaLinkedin={s("linkedinAria")}
                className="mt-3 flex flex-wrap items-center gap-3"
                iconClassName="h-5 w-5"
              />
            </div>
          </div>

          <motion.form
            ref={formRef}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-surface border border-border min-w-0 rounded-md p-8 sm:p-10"
            noValidate
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-foreground ">
                  {t("name")}
                </span>
                <input
                  name="from_name"
                  value={name}
                  onChange={(e) => {
                    dismissFeedback();
                    setName(e.target.value);
                  }}
                  autoComplete="name"
                  maxLength={200}
                  className="rounded-md border border-border/90 bg-surface px-4 py-3 text-foreground outline-none  transition placeholder:text-muted focus:border-accent/55      "
                  placeholder={t("name")}
                />
                {errors.name && (
                  <span className="text-xs text-danger">{errors.name}</span>
                )}
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-foreground ">
                  {t("email")}
                </span>
                <input
                  name="reply_to"
                  value={email}
                  onChange={(e) => {
                    dismissFeedback();
                    setEmail(e.target.value);
                  }}
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  className="rounded-md border border-border/90 bg-surface px-4 py-3 text-foreground outline-none  transition placeholder:text-muted focus:border-accent/55      "
                  placeholder={t("email")}
                />
                {errors.email && (
                  <span className="text-xs text-danger">{errors.email}</span>
                )}
              </label>
            </div>
            <label className="mt-6 flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground ">
                {t("subject")}
              </span>
              <input
                name="subject"
                value={subject}
                onChange={(e) => {
                  dismissFeedback();
                  setSubject(e.target.value);
                }}
                maxLength={200}
                className="rounded-md border border-border/90 bg-surface px-4 py-3 text-foreground outline-none  transition placeholder:text-muted focus:border-accent/55      "
                placeholder={t("subject")}
              />
              {errors.subject && (
                <span className="text-xs text-danger">{errors.subject}</span>
              )}
            </label>
            <label className="mt-6 flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground ">
                {t("message")}
              </span>
              <textarea
                name="message"
                value={message}
                onChange={(e) => {
                  dismissFeedback();
                  setMessage(e.target.value);
                }}
                rows={5}
                maxLength={4000}
                className="resize-y rounded-md border border-border/90 bg-surface px-4 py-3 text-foreground outline-none  transition placeholder:text-muted focus:border-accent/55      "
                placeholder={t("message")}
              />
              {errors.message && (
                <span className="text-xs text-danger">{errors.message}</span>
              )}
            </label>

            {!emailjsConfigured && process.env.NODE_ENV !== "production" && (
              <p className="mt-6 font-mono text-xs text-warning">
                [DEV] Contact form disabled. Set {emailjsMissing.join(", ")} in .env.local.
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status === "loading" || !emailjsConfigured}
                className={buttonClasses("primary", "min-w-[160px] px-8")}
              >
                {status === "loading" ? t("sending") : t("send")}
              </button>
              {status === "success" && (
                <span className="text-sm text-accent ">
                  {t("success")}
                </span>
              )}
              {status === "error" && (
                <span className="text-sm text-danger">{t("error")}</span>
              )}
            </div>
          </motion.form>
        </div>
      </div>
    </Section>
  );
}
