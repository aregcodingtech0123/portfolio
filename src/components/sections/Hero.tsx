"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { buttonClasses } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

function TypingLine({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let i = 0;
    const timeouts: number[] = [];
    const tick = () => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i < text.length) {
        timeouts.push(window.setTimeout(tick, 38 + Math.random() * 28));
      } else {
        const pauseMs = Math.min(2600, 1500 + text.length * 28);
        timeouts.push(window.setTimeout(onComplete, pauseMs));
      }
    };
    timeouts.push(window.setTimeout(tick, 320));
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [text, onComplete]);

  return (
    <>
      {display}
      <span className="inline-block w-2 animate-pulse align-baseline text-accent">
        ▍
      </span>
    </>
  );
}

function HeroRoleTyping({ roles }: { roles: string[] }) {
  const [roleIndex, setRoleIndex] = useState(0);
  const advance = useCallback(() => {
    setRoleIndex((p) => (p + 1) % roles.length);
  }, [roles.length]);

  return (
    <TypingLine
      key={roleIndex}
      text={roles[roleIndex]}
      onComplete={advance}
    />
  );
}

export function Hero() {
  const { hero } = useSiteContent();
  const locale = useLocale();
  const roles = hero.typingRoles;

  return (
    <div
      id="home"
      className="relative isolate min-w-0 overflow-x-clip pt-[5.25rem] pb-12 sm:pt-[5.4rem] sm:pb-14 lg:pb-16"
    >
      <div className="relative z-10 mx-auto flex min-w-0 max-w-6xl flex-col gap-8 px-4 sm:gap-10 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
        <div className="min-w-0 flex-1">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-sm tracking-widest text-accent uppercase"
          >
            {hero.greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-3 font-heading text-3xl font-bold tracking-tight break-words text-foreground sm:text-4xl lg:text-5xl"
          >
            {hero.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-xl text-base leading-relaxed break-words text-muted sm:text-lg"
          >
            <span className="text-foreground">{hero.rolePrefix}</span>{" "}
            <span className="inline-block min-w-0 max-w-full font-mono font-semibold break-words text-accent">
              <HeroRoleTyping key={locale} roles={roles} />
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/#projects" className={buttonClasses("primary")}>
              {hero.ctaProjects}
            </Link>
            <Link href="/#contact" className={buttonClasses("ghost")}>
              {hero.ctaContact}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-2 sm:gap-3"
          >
            {[hero.badges.ai, hero.badges.fullstack, hero.badges.security].map(
              (label) => (
                <Tag key={label} className="px-3 py-1.5 text-xs sm:px-4 sm:py-2">
                  {label}
                </Tag>
              ),
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="relative mx-auto flex w-full max-w-[280px] min-w-0 shrink-0 flex-1 justify-center lg:mx-0 lg:max-w-[300px] lg:justify-end"
        >
          <div className="relative aspect-square w-full min-w-0 overflow-hidden rounded-md border border-border bg-surface p-1">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-sm border border-border bg-background">
              <div className="flex h-24 w-24 items-center justify-center rounded-sm border border-accent font-heading text-2xl font-bold text-accent sm:h-28 sm:w-28 sm:text-3xl">
                AE
              </div>
              <p className="mt-5 max-w-[14rem] text-center font-mono text-xs text-muted sm:text-sm">
                {hero.profileTagline}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
