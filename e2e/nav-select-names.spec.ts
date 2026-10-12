import { expect, seedTheme, test } from "./fixtures";

// What a screen reader is actually handed for each navbar switcher: names
// read from Chromium's own accessibility tree over CDP, not from
// Playwright's accessible-name implementation, so precedence between
// aria-labelledby / aria-label is whatever the browser really does.
//
// Each trigger must be named "<visible label> <current value>": the single
// localized label a sighted (or speech-input) user sees comes first (WCAG
// 2.5.3 Label in Name), then the value, per the ARIA APG listbox-button
// pattern. The compact (<lg) controls hide the label visually but must be
// named the same way.
//
// Compared exactly, not case-insensitively: these controls no longer
// uppercase their text with CSS, so there is no transform for Chromium to
// fold into the name (and no "SKİN" from uppercasing "Skin" under lang=tr).
// The name is exactly what the catalog and the chosen value spell.

type AXNode = {
  ignored: boolean;
  role?: { value: string };
  name?: { value: string };
  properties?: { name: string; value: { value: unknown } }[];
};

async function switcherNames(page: import("@playwright/test").Page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send("Accessibility.getFullAXTree")) as {
    nodes: AXNode[];
  };
  await cdp.detach();
  const visible = nodes.filter((node) => !node.ignored);
  return {
    triggers: visible
      .filter((node) =>
        node.properties?.some(
          (p) => p.name === "hasPopup" && p.value.value === "listbox",
        ),
      )
      .map((node) => node.name?.value),
    listboxes: visible
      .filter((node) => node.role?.value === "listbox")
      .map((node) => node.name?.value),
  };
}

const expected = {
  en: {
    language: "Language English EN",
    mode: "Mode Dark",
    skin: "Skin Terminal",
    listboxes: ["Language", "Mode", "Skin", "Language"],
  },
  tr: {
    language: "Dil Türkçe TR",
    mode: "Tema Koyu",
    skin: "Görünüm Terminal",
    listboxes: ["Dil", "Tema", "Görünüm", "Dil"],
  },
} as const;

for (const locale of ["en", "tr"] as const) {
  for (const { layout, viewport } of [
    { layout: "desktop (visible micro-labels)", viewport: { width: 1280, height: 720 } },
    { layout: "compact (micro-labels hidden)", viewport: { width: 390, height: 844 } },
  ]) {
    test(`navbar switchers are named "<label> <value>" in /${locale}, ${layout}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await seedTheme(page, { skin: "terminal", mode: "dark" });
      await page.goto(`/${locale}`);
      // Skin/mode switchers are disabled until mounted, and only then show
      // the stored value.
      await expect(
        page.locator('button[aria-haspopup="listbox"]:visible:disabled'),
      ).toHaveCount(0);

      const { language, mode, skin, listboxes: listboxNames } = expected[locale];
      // Header switchers, then the footer's language switcher.
      await expect
        .poll(async () => await switcherNames(page))
        .toEqual({
          triggers: [language, mode, skin, language],
          listboxes: listboxNames,
        });
    });
  }
}
