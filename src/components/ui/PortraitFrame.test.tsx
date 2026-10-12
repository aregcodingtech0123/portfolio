import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enMessages from "../../../messages/en.json";
import { PortraitFrame } from "./PortraitFrame";

vi.mock("@/components/providers/SiteContentProvider", () => ({
  useSiteContent: () => ({ hero: { profileTagline: "tagline" } }),
}));

function renderFrame(src?: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <PortraitFrame src={src} />
    </NextIntlClientProvider>,
  );
}

const frameOf = (container: HTMLElement) =>
  container.querySelector("figure > div") as HTMLElement;

describe("PortraitFrame", () => {
  it("renders the photo straight away when a source is configured (no probe, no effect needed)", () => {
    const { container } = renderFrame("/images/profilephoto.jpeg");
    // Present on the very first render, which is what makes it part of the
    // server HTML. The old frame rendered nothing until a client HEAD returned.
    const img = screen.getByRole("img", { name: enMessages.Hero.portraitAlt });
    expect(img.getAttribute("src")).toContain("profilephoto.jpeg");
    expect(img).toHaveAttribute("width", "1200");
    expect(img).toHaveAttribute("height", "1600");
    expect(frameOf(container)).not.toHaveAttribute("aria-hidden");
  });

  it("renders an intentional, hidden empty frame when there is no photo", () => {
    const { container } = renderFrame(undefined);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    const frame = frameOf(container);
    expect(frame).toHaveAttribute("aria-hidden", "true");
    expect(frame.className).toContain("aspect-[3/4]");
    expect(screen.getByText("tagline")).toBeInTheDocument();
  });

  it("falls back to the empty frame if the photo fails to load", () => {
    const { container } = renderFrame("/images/profilephoto.jpeg");
    fireEvent.error(screen.getByRole("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(frameOf(container)).toHaveAttribute("aria-hidden", "true");
  });
});
