"use client";

import { createContext, useContext } from "react";
import type { PortfolioContent } from "@/sanity/fetch";

const SiteContentContext = createContext<PortfolioContent | null>(null);

export function SiteContentProvider({
  value,
  children,
}: {
  value: PortfolioContent;
  children: React.ReactNode;
}) {
  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): PortfolioContent {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error("useSiteContent must be used within SiteContentProvider");
  }
  return ctx;
}

/** Safe accessor when provider may be absent (e.g. tests). */
export function useSiteContentOptional(): PortfolioContent | null {
  return useContext(SiteContentContext);
}
