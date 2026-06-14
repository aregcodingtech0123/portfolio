import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Content Hub",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
};

export default function ContentHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] min-h-svh bg-[#030712]">
      {children}
    </div>
  );
}
