"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { buttonClasses } from "@/components/ui/Button";
import { PortraitFrame } from "@/components/ui/PortraitFrame";

export function Hero() {
  const { hero } = useSiteContent();
  const reduceMotion = useReducedMotion();

  const fade = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: undefined, transition: undefined }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        };

  const essayIn = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: undefined, transition: undefined }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay, duration: 0.5, ease: "easeOut" as const },
        };

  return (
    <div
      id="home"
      className="relative isolate min-w-0 overflow-x-clip pt-[5.5rem] pb-12 sm:pt-24 sm:pb-14 lg:pb-16 minimal:pt-28 minimal:pb-[var(--rhythm-half)] minimal:sm:pt-32"
    >
      {/* Terminal skin */}
      <div className="relative z-10 mx-auto grid min-w-0 max-w-content grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-12 lg:gap-16 lg:px-8 minimal:hidden">
        <div className="min-w-0">
          <motion.p
            {...fade(0)}
            className="decor font-mono text-sm tracking-wide text-accent"
          >
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            {...fade(0.05)}
            className="mt-3 font-heading text-3xl font-bold tracking-tight break-words text-foreground sm:text-4xl lg:text-5xl"
          >
            {hero.name}
          </motion.h1>

          <motion.p
            {...fade(0.1)}
            className="mt-5 max-w-xl text-base leading-relaxed break-words text-foreground sm:text-lg"
          >
            {hero.headline}
          </motion.p>

          <motion.p
            {...fade(0.14)}
            className="mt-4 max-w-xl text-sm leading-relaxed break-words text-muted"
          >
            {hero.subline}
          </motion.p>

          <motion.div
            {...fade(0.18)}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/#projects" className={buttonClasses("primary")}>
              {hero.ctaProjects}
            </Link>
            <Link href="/#contact" className={buttonClasses("ghost")}>
              {hero.ctaContact}
            </Link>
          </motion.div>
        </div>

        <motion.div
          {...fade(0.12)}
          className="flex min-w-0 justify-center md:justify-end"
        >
          <PortraitFrame src="/images/profilephoto.jpeg" />
        </motion.div>
      </div>

      {/* Minimal skin */}
      <div className="relative z-10 mx-auto hidden min-w-0 w-full max-w-content-wide grid-cols-1 items-center gap-10 px-5 sm:px-6 md:grid-cols-2 md:gap-12 lg:gap-16 minimal:grid">
        <div className="min-w-0">
          <motion.h1
            {...essayIn(0.1)}
            className="font-heading text-4xl font-normal leading-[1.15] tracking-tight break-words text-foreground sm:text-5xl"
          >
            {hero.name}
          </motion.h1>

          <motion.p
            {...essayIn(0.18)}
            className="mt-5 font-heading text-xl font-normal leading-snug tracking-tight break-words text-foreground sm:text-2xl"
          >
            {hero.headline}
          </motion.p>

          <motion.p
            {...essayIn(0.26)}
            className="mt-5 text-base leading-relaxed break-words text-muted sm:text-[1.05rem]"
          >
            {hero.subline}
          </motion.p>

          <motion.div
            {...essayIn(0.34)}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
          >
            <Link
              href="/#projects"
              className="essay-link text-base text-foreground"
            >
              {hero.ctaProjects}
            </Link>
            <Link
              href="/#contact"
              className="essay-link text-base text-foreground"
            >
              {hero.ctaContact}
            </Link>
          </motion.div>
        </div>

        <motion.div
          {...essayIn(0.2)}
          className="flex min-w-0 justify-center md:justify-end"
        >
          <PortraitFrame src="/images/profilephoto.jpeg" />
        </motion.div>
      </div>
    </div>
  );
}
