import type { Metadata, Viewport } from "next";

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

export default function ContentHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    {/* `dark` pins the Studio to the dark token set regardless of the site theme. */}
    <div className="dark fixed inset-0 z-[9999] min-h-svh bg-background">
      {children}
    </div>
  );
}
