import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type { ProjectDisplay } from "@/sanity/fetch";
import enMessages from "../../../messages/en.json";
import { ProjectModal } from "./ProjectModal";

// No liveUrl/githubUrl/technologies/highlights on purpose: this keeps the
// dialog down to exactly two focusable elements (header close button,
// footer close button). Both the terminal and minimal skins' markup render
// simultaneously in jsdom, since no real stylesheet is loaded to apply the
// CSS that hides one skin's variant -- a project with a liveUrl/githubUrl
// would double the focusable link count (one per skin) and make "first"/
// "last" in the trap test ambiguous.
const project: ProjectDisplay = {
  id: "p1",
  code: "P1",
  status: "live",
  title: "Test Project",
  description: "A test project for the modal.",
  technologies: [],
  category: "fullstack",
  featured: true,
};

function renderModal(onClose: () => void = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ProjectModal project={project} open onClose={onClose} />
    </NextIntlClientProvider>,
  );
}

describe("ProjectModal", () => {
  it("renders a dialog with the correct aria wiring", async () => {
    renderModal();
    const dialog = await waitFor(() => screen.getByRole("dialog"));
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)).toHaveTextContent(
      "Test Project",
    );
  });

  it("moves focus onto the header close button on open", async () => {
    renderModal();
    const closeButtons = await waitFor(() =>
      screen.getAllByRole("button", { name: "Close" }),
    );
    await waitFor(() => expect(closeButtons[0]).toHaveFocus());
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    await waitFor(() => screen.getByRole("dialog"));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    const dialog = await waitFor(() => screen.getByRole("dialog"));
    // The backdrop is the dialog's sibling under the same role="presentation"
    // wrapper, and renders before the dialog in document order, so it is the
    // first [aria-hidden] match in the wrapper's subtree.
    const backdrop = dialog.parentElement?.querySelector("[aria-hidden]");
    expect(backdrop).toBeTruthy();

    fireEvent.click(backdrop as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab/Shift+Tab between the header and footer close buttons", async () => {
    renderModal();
    const closeButtons = await waitFor(() => {
      const buttons = screen.getAllByRole("button", { name: "Close" });
      expect(buttons).toHaveLength(2);
      return buttons;
    });
    const [header, footer] = closeButtons;
    await waitFor(() => expect(header).toHaveFocus());

    // Shift+Tab from the first focusable element wraps to the last.
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(footer).toHaveFocus();

    // Tab from the last focusable element wraps back to the first.
    fireEvent.keyDown(document, { key: "Tab" });
    expect(header).toHaveFocus();
  });
});

// Focus restoration to the triggering project card is NOT covered here: it
// lives in ProjectsWithQuery (src/components/sections/Projects.tsx), which
// owns the triggerRef and calls .focus() on close. ProjectModal itself only
// ever focuses its own close button; testing restoration means testing
// Projects + ProjectModal together, not this component in isolation.
