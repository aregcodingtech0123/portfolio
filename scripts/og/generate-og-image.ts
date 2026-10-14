/**
 * Generates the one static Open Graph / Twitter preview image,
 * public/images/og-image.png (1200x630), from a small HTML template.
 *
 *   npm run build            # once; the script serves that build
 *   npm run og:image -- --site https://arda-ege-tunc.vercel.app
 *
 * Why a screenshot and not next/og: the template is rendered by the built
 * site itself (`next start`, scripts/perf/server.mjs), so it uses the site's
 * own self-hosted next/font files, latin-ext subset included, and the Turkish
 * glyphs render exactly as on the page. Nothing is fetched from the network:
 * every hostname except localhost fails at Chromium's resolver. The script
 * fails if a font face did not load, so a fallback font can never be
 * committed by accident.
 *
 * Text comes from the content and the owner-confirmed identity: the name,
 * the confirmed job title in both languages, and the site's host.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { migrationPortfolio } from "../../src/data/migration-portfolio";
import { OWNER_IDENTITY } from "../../src/lib/seo/identity";
import { OG_IMAGE } from "../../src/lib/seo/site";
import { BASE_URL } from "../perf/env.mjs";
import { start } from "../perf/server.mjs";

const PORTRAIT = "/images/profilephoto.jpeg";
const OUT = path.join(process.cwd(), "public", OG_IMAGE.path);

function siteHost(): string {
  const flag = process.argv.indexOf("--site");
  const raw = flag !== -1 ? process.argv[flag + 1] : process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) throw new Error("Pass the production URL: --site https://example.dev");
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("--site must be the https production URL");
  return url.host;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Terminal skin, dark mode: the site's default look. */
function template(texts: { name: string; roleEn: string; roleTr: string; host: string }): string {
  const { name, roleEn, roleTr, host } = texts;
  return `
<div id="og" style="
  width:${OG_IMAGE.width}px;height:${OG_IMAGE.height}px;box-sizing:border-box;
  display:flex;align-items:center;justify-content:space-between;gap:56px;
  padding:72px 80px;background:#0a0c0f;color:#e8eaed;
  background-image:radial-gradient(circle at 85% 20%, rgba(91,242,155,0.10), transparent 55%);
">
  <div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;min-width:0;">
    <div>
      <p data-font="mono" style="margin:0;font-family:var(--font-jetbrains);font-size:26px;color:#5bf29b;letter-spacing:0.02em;">$ whoami</p>
      <h1 data-font="heading" style="margin:20px 0 0;font-family:var(--font-bricolage);font-weight:700;font-size:84px;line-height:1.02;letter-spacing:-0.02em;">${escapeHtml(name)}</h1>
      <p data-font="body" style="margin:28px 0 0;font-family:var(--font-inter);font-weight:500;font-size:34px;color:#e8eaed;">${escapeHtml(roleEn)}</p>
      <p data-font="body" style="margin:10px 0 0;font-family:var(--font-inter);font-weight:500;font-size:34px;color:#9aa3ad;">${escapeHtml(roleTr)}</p>
    </div>
    <p data-font="mono" style="margin:0;font-family:var(--font-jetbrains);font-size:26px;color:#9aa3ad;">${escapeHtml(host)}</p>
  </div>
  <img src="${PORTRAIT}" alt="" style="
    flex:none;width:330px;height:440px;object-fit:cover;border-radius:28px;
    border:2px solid rgba(91,242,155,0.55);
  "/>
</div>`;
}

async function main() {
  const host = siteHost();
  const name = migrationPortfolio.siteSettings.siteName;
  const texts = { name, roleEn: OWNER_IDENTITY.jobTitle.en, roleTr: OWNER_IDENTITY.jobTitle.tr, host };

  const stop = await start();
  const browser = await chromium.launch({
    args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: OG_IMAGE.width, height: OG_IMAGE.height },
      deviceScaleFactor: 1,
    });
    // The built page provides the next/font @font-face rules and the
    // --font-* variables on <html>; only the body is replaced.
    await page.goto(`${BASE_URL}/en`, { waitUntil: "networkidle" });
    await page.evaluate((html) => {
      document.body.innerHTML = html;
      document.body.style.margin = "0";
    }, template(texts));

    const problems = await page.evaluate(async () => {
      const issues: string[] = [];
      const img = document.querySelector<HTMLImageElement>("#og img");
      if (img) {
        await img.decode().catch(() => issues.push("portrait did not load"));
      }
      for (const el of document.querySelectorAll<HTMLElement>("#og [data-font]")) {
        const style = getComputedStyle(el);
        const primary = style.fontFamily.split(",")[0];
        // Request every glyph of the text plus the Turkish letters, so the
        // latin-ext face is loaded and verified too.
        const text = `${el.textContent ?? ""} çğıöşüÇĞİÖŞÜ`;
        const faces = await document.fonts.load(`${style.fontWeight} ${style.fontSize} ${primary}`, text);
        if (faces.length === 0 || faces.some((face) => face.status !== "loaded")) {
          issues.push(`font ${primary} did not load for "${el.textContent}"`);
        }
      }
      await document.fonts.ready;
      return issues;
    });
    if (problems.length > 0) throw new Error(problems.join("\n"));

    await mkdir(path.dirname(OUT), { recursive: true });
    const png = await page.locator("#og").screenshot({ type: "png" });
    // PNG IHDR: width and height are the big-endian uint32s at bytes 16 and 20.
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width !== OG_IMAGE.width || height !== OG_IMAGE.height) {
      throw new Error(`expected ${OG_IMAGE.width}x${OG_IMAGE.height}, got ${width}x${height}`);
    }
    await writeFile(OUT, png);
    console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${width}x${height}, ${Math.round(png.length / 1024)} KB)`);
  } finally {
    await browser.close();
    stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
