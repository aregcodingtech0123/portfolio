/**
 * Builds the site icons from the owner's SVG (public/icons/user-round-check.svg):
 *
 * - src/app/favicon.ico: 16, 32 and 48 px PNG frames in one ICO
 * - src/app/apple-icon.png: 180 px, opaque (iOS draws its own mask)
 *
 *   npm run icons
 *
 * The SVG uses `currentColor` and no background, which would be a black glyph
 * that disappears on dark browser tabs, so it is drawn in the terminal skin's
 * accent on the site's background. Rasterized by Chromium (Playwright, no
 * network: the page is set from a string).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const SOURCE = path.join(process.cwd(), "public", "icons", "user-round-check.svg");
const FAVICON = path.join(process.cwd(), "src", "app", "favicon.ico");
const APPLE_ICON = path.join(process.cwd(), "src", "app", "apple-icon.png");

const BACKGROUND = "#0a0c0f";
const FOREGROUND = "#5bf29b";

function page(svg: string, size: number, { rounded }: { rounded: boolean }): string {
  const glyph = svg
    .replace(/stroke="currentColor"/g, `stroke="${FOREGROUND}"`)
    .replace(/\swidth="\d+"/, ` width="${Math.round(size * 0.72)}"`)
    .replace(/\sheight="\d+"/, ` height="${Math.round(size * 0.72)}"`)
    .replace(/\sclass="[^"]*"/, "");
  return `<!doctype html><html><body style="margin:0;background:transparent">
<div id="icon" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
background:${BACKGROUND};border-radius:${rounded ? Math.round(size * 0.22) : 0}px">${glyph}</div></body></html>`;
}

/** ICO container with PNG frames (supported by every current browser). */
function ico(frames: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * frames.length;
  for (const { size, png } of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]);
}

async function main() {
  const svg = await readFile(SOURCE, "utf8");
  const browser = await chromium.launch();
  try {
    const render = async (size: number, rounded: boolean) => {
      const tab = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      await tab.setContent(page(svg, size, { rounded }));
      const png = await tab.locator("#icon").screenshot({ type: "png", omitBackground: rounded });
      await tab.close();
      return png;
    };
    const frames = [];
    for (const size of [16, 32, 48]) frames.push({ size, png: await render(size, true) });
    await writeFile(FAVICON, ico(frames));
    await writeFile(APPLE_ICON, await render(180, false));
    console.log(`Wrote ${path.relative(process.cwd(), FAVICON)} (16/32/48) and ${path.relative(process.cwd(), APPLE_ICON)} (180)`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
