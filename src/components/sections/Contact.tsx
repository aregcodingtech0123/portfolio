"use client";

import emailjs, { EmailJSResponseStatus } from "@emailjs/browser";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { SocialExternalLinks } from "@/components/ui/SocialIcons";
import { isValidMailbox } from "@/lib/mailto";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

type FieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

const EMAILJS_SERVICE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "BURAYA_SERVICE_ID_GELECEK";
const EMAILJS_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "BURAYA_TEMPLATE_ID_GELECEK";
const EMAILJS_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "BURAYA_PUBLIC_KEY_GELECEK";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const form = formRef.current;
    if (!form) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        form,
        { publicKey: EMAILJS_PUBLIC_KEY },
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
            <h2 className="text-3xl font-bold tracking-tight break-words text-slate-900 dark:text-surface sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed break-words text-slate-600 dark:text-slate-400">
              {t("subtitle")}
            </p>
            <dl className="mt-10 space-y-6 text-sm">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-500">
                  {t("social.emailLabel")}
                </dt>
                <dd className="mt-1">
                  {isValidMailbox(contact.email) ? (
                    <a
                      href={`mailto:${contact.email.trim()}`}
                      className="text-sky-600 transition hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">
                      {contact.email}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-500">
                  {t("social.locationLabel")}
                </dt>
                <dd className="mt-1 text-slate-700 dark:text-slate-300">
                  {contact.location}
                </dd>
              </div>
            </dl>
            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
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
            className="glass-panel min-w-0 rounded-3xl p-8 sm:p-10"
            noValidate
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
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
                  className="rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-slate-900 outline-none ring-sky-500/0 transition placeholder:text-slate-400 focus:border-sky-500/55 focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/50 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-600"
                  placeholder={t("name")}
                />
                {errors.name && (
                  <span className="text-xs text-red-400">{errors.name}</span>
                )}
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
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
                  className="rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-slate-900 outline-none ring-sky-500/0 transition placeholder:text-slate-400 focus:border-sky-500/55 focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/50 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-600"
                  placeholder={t("email")}
                />
                {errors.email && (
                  <span className="text-xs text-red-400">{errors.email}</span>
                )}
              </label>
            </div>
            <label className="mt-6 flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
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
                className="rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-slate-900 outline-none ring-sky-500/0 transition placeholder:text-slate-400 focus:border-sky-500/55 focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/50 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-600"
                placeholder={t("subject")}
              />
              {errors.subject && (
                <span className="text-xs text-red-400">{errors.subject}</span>
              )}
            </label>
            <label className="mt-6 flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
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
                className="resize-y rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-slate-900 outline-none ring-sky-500/0 transition placeholder:text-slate-400 focus:border-sky-500/55 focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600/50 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-600"
                placeholder={t("message")}
              />
              {errors.message && (
                <span className="text-xs text-red-400">{errors.message}</span>
              )}
            </label>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex min-h-[48px] min-w-[160px] touch-manipulation items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_32px_rgba(56,189,248,0.35)] transition hover:shadow-[0_0_44px_rgba(34,211,238,0.45)] disabled:pointer-events-none disabled:opacity-60"
              >
                {status === "loading" ? t("sending") : t("send")}
              </button>
              {status === "success" && (
                <span className="text-sm text-emerald-500 dark:text-emerald-400">
                  {t("success")}
                </span>
              )}
              {status === "error" && (
                <span className="text-sm text-red-400">{t("error")}</span>
              )}
            </div>
          </motion.form>
        </div>
      </div>
    </Section>
  );
}
