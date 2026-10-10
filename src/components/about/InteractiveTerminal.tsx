"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { socialLinks } from "@/components/ui/SocialIcons";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

type TerminalEntry = {
  id: string;
  kind: "input" | "output" | "error";
  fullText: string;
  renderedText: string;
};

const MAX_COMMAND_LEN = 512;
const MAX_OUTPUT_LINE_LEN = 8000;
const MAX_ENTRIES = 120;

function clampLine(text: string): string {
  if (text.length <= MAX_OUTPUT_LINE_LEN) return text;
  return `${text.slice(0, MAX_OUTPUT_LINE_LEN)}…`;
}

export function InteractiveTerminal() {
  const t = useTranslations("Terminal");
  const content = useSiteContent();
  const [entries, setEntries] = useState<TerminalEntry[]>([
    {
      id: "welcome-1",
      kind: "output",
      fullText: t("welcome1"),
      renderedText: t("welcome1"),
    },
    {
      id: "welcome-2",
      kind: "output",
      fullText: t("welcome2"),
      renderedText: t("welcome2"),
    },
  ]);
  const [command, setCommand] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  const prompt = useMemo(() => "arda@portfolio:~$", []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const addTypedOutput = (kind: "output" | "error", text: string, delayMs: number) => {
    const safeText = clampLine(text);
    const id = `out-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
    setEntries((prev) => {
      const next = [
        ...prev,
        { id, kind, fullText: safeText, renderedText: "" },
      ];
      return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
    });

    const starter = window.setTimeout(() => {
      let i = 0;
      const tick = () => {
        i += 1;
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? { ...entry, renderedText: safeText.slice(0, i) }
              : entry,
          ),
        );
        if (i < safeText.length) {
          const next = window.setTimeout(tick, 12);
          timersRef.current.push(next);
        }
      };
      tick();
    }, delayMs);
    timersRef.current.push(starter);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = command.trim();
    if (!raw) return;
    if (raw.length > MAX_COMMAND_LEN) {
      setCommand("");
      addTypedOutput(
        "error",
        t("tooLong", { max: MAX_COMMAND_LEN }),
        0,
      );
      return;
    }

    const now = Date.now();
    const normalized = raw.toLowerCase();
    const inputEntry: TerminalEntry = {
      id: `in-${now}`,
      kind: "input",
      fullText: `${prompt} ${raw}`,
      renderedText: `${prompt} ${raw}`,
    };

    if (normalized === "clear") {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      setEntries([]);
      setCommand("");
      return;
    }

    const outputLines: Record<string, string[]> = {
      help: [t("help")],
      whoami: [t("whoami")],
      projects: content.projects.length
        ? content.projects.map((p) => p.title)
        : [t("noProjects")],
      skills: [t("skills")],
      contact: [
        t("linkedin", { url: socialLinks.linkedin }),
        t("github", { url: socialLinks.github }),
      ],
    };

    setEntries((prev) => {
      const next = [...prev, inputEntry];
      return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
    });

    if (outputLines[normalized]) {
      outputLines[normalized].forEach((line, index) => {
        addTypedOutput("output", clampLine(line), 80 + index * 180);
      });
    } else {
      addTypedOutput(
        "error",
        t("notFound"),
        80,
      );
    }

    setCommand("");
  };

  return (
    <div className="dark max-w-full overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex min-w-0 items-center gap-2 border-b border-border/50 bg-surface/70 px-3 py-3 sm:px-4 ">
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-danger/90" />
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-warning/90" />
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-accent/90" />
        <span className="ml-1 min-w-0 truncate text-[11px] font-medium tracking-wide text-muted sm:ml-3">
          terminal://about-me
        </span>
      </div>

      <div className="flex min-h-[18rem] flex-col bg-background font-code text-sm leading-relaxed text-foreground min-[380px]:h-[21rem] sm:h-[23rem]">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-3 sm:p-4"
        >
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.p
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-full break-words [overflow-wrap:anywhere] ${
                  entry.kind === "input"
                    ? "text-accent"
                    : entry.kind === "error"
                      ? "text-danger"
                      : "text-foreground"
                }`}
              >
                {entry.renderedText}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-w-0 items-center gap-2 border-t border-border/70 bg-surface/95 px-3 py-3 sm:px-4"
        >
          <span className="shrink-0 text-accent">{prompt}</span>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-label={t("inputLabel")}
            className="min-w-0 flex-1 touch-manipulation bg-transparent text-foreground outline-none placeholder:text-muted"
            placeholder={t("inputPlaceholder")}
          />
          <span className="inline-block h-4 w-2 animate-pulse bg-accent/90" />
        </form>
      </div>
    </div>
  );
}
