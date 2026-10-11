import {
  expect,
  installThemeMutationLog,
  readThemeLog,
  seedTheme,
  test,
  type Mode,
  type Skin,
} from "./fixtures";

const COMBOS: Array<{ skin: Skin; mode: Mode }> = [
  { skin: "terminal", mode: "dark" },
  { skin: "terminal", mode: "light" },
  { skin: "minimal", mode: "dark" },
  { skin: "minimal", mode: "light" },
];

for (const { skin, mode } of COMBOS) {
  test(`boot script applies ${skin}/${mode} before paint, with no flash of the wrong theme`, async ({
    page,
  }) => {
    await installThemeMutationLog(page);
    await seedTheme(page, { skin, mode });
    await page.goto("/en");

    const log = await readThemeLog(page);
    // Entry 0 is the pre-boot-script baseline (captured the instant <html>
    // exists, before <head>'s script has run): it must show nothing set
    // yet, confirming the observer attached early enough to matter.
    expect(log[0].skin).toBeUndefined();
    expect(log[0].classes).not.toContain("light");
    expect(log[0].classes).not.toContain("dark");
    expect(log.length).toBeGreaterThan(1);

    // Every mutation after that baseline must already show the seeded
    // value -- never a default-then-corrected sequence.
    for (const entry of log.slice(1)) {
      expect(entry.skin).toBe(skin);
      expect(entry.classes).toContain(mode);
      expect(entry.colorScheme).toBe(mode);
    }
  });
}

test("with no stored mode, the boot script falls back to the system preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await installThemeMutationLog(page);
  await seedTheme(page, { skin: "terminal" }); // mode intentionally omitted
  await page.goto("/en");

  const log = await readThemeLog(page);
  expect(log.length).toBeGreaterThan(1);
  for (const entry of log.slice(1)) {
    expect(entry.classes).toContain("light");
  }
});

test("a corrupted stored mode and skin fall back safely instead of breaking the page", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await page.emulateMedia({ colorScheme: "dark" });
  await seedTheme(page, { mode: "not-a-real-mode", skin: "also-not-real" });
  await page.goto("/en");

  // Falls back to the system preference (dark) and the default skin, not a
  // crash and not a stuck invalid value.
  const attrs = await page.evaluate(() => ({
    skin: document.documentElement.dataset.skin,
    classes: document.documentElement.className,
  }));
  expect(attrs.skin).toBe("terminal");
  expect(attrs.classes).toContain("dark");
  expect(attrs.classes).not.toContain("not-a-real-mode");
  await expect(page.getByRole("heading").first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
