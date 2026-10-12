import type { Metadata, Viewport } from "next";
import { RootShell } from "@/app/root-shell";

export const metadata: Metadata = {
  title: "Content Hub",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
};

/** Root layout of the Studio: its own document, separate from the localized site. */
export default function ContentHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `dark` pins the Studio to the dark token set regardless of the site theme.
  return (
    <RootShell lang="en">
      <div className="dark fixed inset-0 z-[9999] min-h-svh bg-background">
        {children}
      </div>
    </RootShell>
  );
}
