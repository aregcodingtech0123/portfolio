"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Line =
  | { kind: "prompt"; text: string }
  | { kind: "output"; text: string }
  | { kind: "blocked"; text: string };

type TerminalWindowProps = {
  name: string;
  onBlocked?: () => void;
  className?: string;
};

function buildScript(name: string): Line[] {
  return [
    { kind: "prompt", text: "$ whoami" },
    { kind: "output", text: name.toLowerCase() },
    { kind: "prompt", text: "$ cat focus.txt" },
    { kind: "output", text: "ai engineering / full stack / security" },
    { kind: "prompt", text: "$ ./guardrail --test" },
    { kind: "blocked", text: "[BLOCKED] prompt injection attempt" },
  ];
}

export function TerminalWindow({
  name,
  onBlocked,
  className = "",
}: TerminalWindowProps) {
  const script = useMemo(() => buildScript(name), [name]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(script.length);
      if (script.some((line) => line.kind === "blocked")) {
        onBlockedRef.current?.();
      }
      return;
    }

    setVisibleCount(0);
    const timers: number[] = [];
    let i = 0;

    const step = () => {
      i += 1;
      setVisibleCount(i);
      const line = script[i - 1];
      if (line?.kind === "blocked") onBlockedRef.current?.();
      if (i < script.length) {
        const delay = line?.kind === "prompt" ? 280 : 420;
        timers.push(window.setTimeout(step, delay));
      }
    };

    timers.push(window.setTimeout(step, 220));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [script, reducedMotion]);

  const lines = script.slice(0, visibleCount);

  return (
    <div
      className={`relative overflow-hidden rounded-md border border-border bg-surface/90 ${className}`.trim()}
      role="region"
      aria-label="Terminal"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-danger" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-sm bg-warning" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-sm bg-accent" aria-hidden />
        <span className="ml-2 font-mono text-[10px] tracking-wide text-muted">
          ~/session
        </span>
      </div>

      <div className="min-h-[11.5rem] space-y-1.5 bg-background/80 p-3 font-mono text-[12px] leading-relaxed sm:min-h-[12.5rem] sm:p-4 sm:text-[13px]">
        {lines.map((line, index) => {
          if (line.kind === "prompt") {
            return (
              <p key={`${index}-p`} className="text-accent">
                {line.text}
              </p>
            );
          }
          if (line.kind === "blocked") {
            return (
              <p key={`${index}-b`} className="text-danger">
                {line.text}
              </p>
            );
          }
          return (
            <p key={`${index}-o`} className="pl-3 text-muted">
              {line.text}
            </p>
          );
        })}
        {!reducedMotion && visibleCount < script.length && (
          <span
            className="inline-block h-3.5 w-1.5 translate-y-0.5 bg-accent"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
