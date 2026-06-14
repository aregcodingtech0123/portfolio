"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({ id, children, className = "" }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%", amount: 0.2 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.42,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`scroll-mt-28 ${className}`}
    >
      {children}
    </motion.section>
  );
}
