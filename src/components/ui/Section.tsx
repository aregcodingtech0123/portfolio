"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

type Props = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({ id, children, className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const { skin } = useTheme();
  const essay = skin === "minimal";

  return (
    <motion.section
      id={id}
      initial={
        reduceMotion
          ? false
          : essay
            ? { opacity: 0 }
            : { opacity: 0, y: 20 }
      }
      whileInView={
        reduceMotion
          ? undefined
          : essay
            ? { opacity: 1 }
            : { opacity: 1, y: 0 }
      }
      viewport={{ once: true, margin: "-8%", amount: 0.2 }}
      transition={{
        duration: reduceMotion ? 0.01 : essay ? 0.45 : 0.42,
        ease: essay ? "easeOut" : [0.22, 1, 0.36, 1],
      }}
      className={`scroll-mt-28 minimal:py-[var(--rhythm-half)] ${className}`}
    >
      {children}
    </motion.section>
  );
}
