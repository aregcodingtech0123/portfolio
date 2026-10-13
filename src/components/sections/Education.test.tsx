import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import enMessages from "../../../messages/en.json";
import type { EducationItem } from "@/types/content";
import { Education } from "./Education";

const baseItem: EducationItem = {
  id: "edu-1",
  institution: "Ankara Science University",
  degree: "B.Sc.",
  fieldOfStudy: "Computer Engineering",
  period: "2021 – 2025",
};

function renderEducation(items: EducationItem[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <Education items={items} sectionLabel="// 05 education" />
    </NextIntlClientProvider>,
  );
}

describe("Education location", () => {
  it("shows location in both skins when it is set", () => {
    const { container } = renderEducation([
      { ...baseItem, location: "Ankara, Turkey" },
    ]);

    const terminalOrg = container.querySelector(
      "#education .minimal\\:hidden li p.text-sm",
    );
    expect(terminalOrg?.textContent).toBe(
      "Ankara Science University · Ankara, Turkey",
    );

    const org = container.querySelector("#education .m-tl-org");
    expect(org?.textContent).toBe("Ankara Science University · Ankara, Turkey");
    expect(org?.querySelector(".m-meta")?.textContent).toBe(" · Ankara, Turkey");
  });

  it("renders no extra location node when the field is absent", () => {
    const { container } = renderEducation([baseItem]);

    const terminalOrg = container.querySelector(
      "#education .minimal\\:hidden li p.text-sm",
    );
    expect(terminalOrg?.textContent).toBe("Ankara Science University");
    expect(terminalOrg?.childNodes).toHaveLength(1);

    const org = container.querySelector("#education .m-tl-org");
    expect(org?.textContent).toBe("Ankara Science University");
    expect(org?.querySelector(".m-meta")).toBeNull();
    expect(org?.childNodes).toHaveLength(1);
  });

  it("renders no extra location node when location is blank", () => {
    const { container } = renderEducation([{ ...baseItem, location: "" }]);

    const terminalOrg = container.querySelector(
      "#education .minimal\\:hidden li p.text-sm",
    );
    expect(terminalOrg?.textContent).toBe("Ankara Science University");
    expect(container.querySelector("#education .m-tl-org .m-meta")).toBeNull();
  });
});
