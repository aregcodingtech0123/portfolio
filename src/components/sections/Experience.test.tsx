import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import enMessages from "../../../messages/en.json";
import type { ExperienceItem } from "@/types/content";
import { Experience } from "./Experience";

const baseItem: ExperienceItem = {
  company: "Acme",
  role: "Engineer",
  period: "2024 – Present",
  description: "Built things.",
};

function renderExperience(items: ExperienceItem[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <Experience items={items} />
    </NextIntlClientProvider>,
  );
}

describe("Experience location", () => {
  it("shows location in both skins when it is set", () => {
    const { container } = renderExperience([
      { ...baseItem, location: "Lisbon, Portugal" },
    ]);

    const terminalHeading = container.querySelector(
      "#experience .minimal\\:hidden h3",
    );
    expect(terminalHeading?.textContent).toBe("Engineer @ Acme · Lisbon, Portugal");
    expect(terminalHeading?.querySelector(".text-muted:last-child")?.textContent).toBe(
      " · Lisbon, Portugal",
    );

    const org = container.querySelector("#experience .m-tl-org");
    expect(org?.textContent).toBe("Acme · Lisbon, Portugal");
    expect(org?.querySelector(".m-meta")?.textContent).toBe(" · Lisbon, Portugal");
  });

  it("renders no extra location node when the field is absent", () => {
    const { container } = renderExperience([baseItem]);

    const terminalHeading = container.querySelector(
      "#experience .minimal\\:hidden h3",
    );
    expect(terminalHeading?.textContent).toBe("Engineer @ Acme");
    expect(terminalHeading?.querySelectorAll("span")).toHaveLength(1);

    const org = container.querySelector("#experience .m-tl-org");
    expect(org?.textContent).toBe("Acme");
    expect(org?.querySelector(".m-meta")).toBeNull();
    expect(org?.childNodes).toHaveLength(1);
  });

  it("renders no extra location node when location is blank", () => {
    const { container } = renderExperience([{ ...baseItem, location: "" }]);

    const terminalHeading = container.querySelector(
      "#experience .minimal\\:hidden h3",
    );
    expect(terminalHeading?.textContent).toBe("Engineer @ Acme");
    expect(container.querySelector("#experience .m-tl-org .m-meta")).toBeNull();
  });
});
