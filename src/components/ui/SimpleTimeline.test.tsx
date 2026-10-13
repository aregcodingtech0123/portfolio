import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SimpleTimelineRow } from "./SimpleTimeline";

function renderRow(props: Partial<Parameters<typeof SimpleTimelineRow>[0]> = {}) {
  return render(
    <ol>
      <SimpleTimelineRow
        period={"2024 \u2013 Present"}
        currentLabel="Current"
        title="Engineer"
        org="Acme"
        description="Built things."
        {...props}
      />
    </ol>,
  );
}

describe("SimpleTimelineRow", () => {
  it("renders period, title, organisation and description in reading order", () => {
    renderRow();
    const text = screen.getByRole("listitem").textContent;
    expect(text).toBe("2024 \u2013 PresentEngineerAcmeBuilt things.");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Engineer");
  });

  it("shows the status marker only when the entry is current", () => {
    const { unmount } = renderRow({ current: true });
    expect(screen.getByText("Current")).toBeTruthy();
    unmount();

    renderRow({ current: false });
    expect(screen.queryByText("Current")).toBeNull();
  });

  it("omits empty period, organisation and description", () => {
    renderRow({ period: "", org: "", description: undefined });
    expect(screen.getByRole("listitem").textContent).toBe("Engineer");
  });

  it("shows location as quiet meta next to the organisation", () => {
    renderRow({ location: "Lisbon, Portugal" });
    const org = screen.getByRole("listitem").querySelector(".m-tl-org");
    expect(org?.textContent).toBe("Acme · Lisbon, Portugal");
    expect(org?.querySelector(".m-meta")?.textContent).toBe(" · Lisbon, Portugal");
  });

  it("renders no extra node when location is absent", () => {
    const { container } = renderRow();
    const org = container.querySelector(".m-tl-org");
    expect(org?.textContent).toBe("Acme");
    expect(org?.querySelector(".m-meta")).toBeNull();
    expect(org?.childNodes).toHaveLength(1);
  });

  it("renders no extra node when location is blank", () => {
    renderRow({ location: "" });
    const org = screen.getByRole("listitem").querySelector(".m-tl-org");
    expect(org?.textContent).toBe("Acme");
    expect(org?.querySelector(".m-meta")).toBeNull();
  });
});
