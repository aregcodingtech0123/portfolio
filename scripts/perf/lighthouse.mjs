/**
 * Lighthouse runner. Serves a PRODUCTION build and measures it in Chromium.
 *
 *   npm run perf                      # build, serve, 5 runs x every config
 *   npm run perf -- --runs 3          # fewer repetitions
 *   npm run perf -- --skip-build      # reuse the existing .next build
 *   npm run perf -- --form mobile --locale en --skin terminal --mode dark
 *
 * How each skin/mode is forced (the ?skin= / ?mode= overrides are compiled
 * out of production builds): before every navigation a script registered with
 * Page.addScriptToEvaluateOnNewDocument writes `skin` and `theme` into
 * localStorage on the page's origin. That runs before the inline boot script
 * in <head>, which is exactly how a returning visitor's saved choice is read.
 * Lighthouse still clears storage and cache before the load, so each run is a
 * cold first visit; the seed is re-applied at document creation, after that
 * reset. After the run the harness reads <html data-skin> and the dark/light
 * class back and fails the run if they differ from what was requested.
 *
 * Network isolation: Chromium starts with a host-resolver rule that maps every
 * hostname except localhost to NOTFOUND, so nothing (Turnstile, EmailJS,
 * Sanity, Gemini, Google Fonts) can leave the machine, whatever the page does.
 * Attempted external requests still show up as failed entries in the report.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import puppeteer from "puppeteer-core";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { BASE_URL } from "./env.mjs";
import { build, start } from "./server.mjs";
import { slimRun } from "./extract.mjs";
import { summarize } from "./summarize.mjs";

const HOST_RESOLVER_RULES = "MAP * ~NOTFOUND , EXCLUDE localhost";
const MODE_KEY = "theme";
const SKIN_KEY = "skin";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const flag = (name) => process.argv.includes(`--${name}`);
const list = (value) => value.split(",").map((s) => s.trim()).filter(Boolean);

const RUNS = Number(arg("runs", 5));
const FORMS = list(arg("form", "mobile,desktop"));
const LOCALES = list(arg("locale", "en,tr"));
const SKINS = list(arg("skin", "terminal,minimal"));
const MODES = list(arg("mode", "dark,light"));
const OUT_DIR = path.resolve(arg("out", "perf-results"));
// "simulate" (Lighthouse default, models Slow 4G) or "devtools" (applies the throttling to the real load).
const THROTTLING = arg("throttling", undefined);

const configs = [];
for (const form of FORMS)
  for (const locale of LOCALES)
    for (const skin of SKINS)
      for (const mode of MODES)
        configs.push({ id: `${form}-${locale}-${skin}-${mode}`, form, locale, skin, mode });

export async function runOnce(cfg, extraFlags = {}) {
  const browser = await puppeteer.launch({
    executablePath: chromium.executablePath(),
    headless: true,
    args: [
      `--host-resolver-rules=${HOST_RESOLVER_RULES}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      // Hosted CI runners (Ubuntu 24.04) block the unprivileged user namespaces
      // Chromium's sandbox needs; Playwright's own launcher drops the sandbox
      // there too. Never set locally.
      ...(process.env.CI ? ["--no-sandbox", "--disable-dev-shm-usage"] : []),
      // Experiments only (e.g. --force-prefers-reduced-motion to see what the entrance animations cost).
      ...(process.env.PERF_CHROME_ARGS ? process.env.PERF_CHROME_ARGS.split(" ") : []),
    ],
  });
  try {
    const page = await browser.newPage();
    const origin = new URL(BASE_URL).origin;
    await page.evaluateOnNewDocument(
      (o, mk, sk, mode, skin) => {
        if (location.origin !== o) return;
        try {
          localStorage.setItem(mk, mode);
          localStorage.setItem(sk, skin);
        } catch {
          /* storage unavailable */
        }
      },
      origin,
      MODE_KEY,
      SKIN_KEY,
      cfg.mode,
      cfg.skin,
    );

    const url = `${BASE_URL}/${cfg.locale}`;
    const flags = {
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance"],
      ...extraFlags,
    };
    const result = await lighthouse(
      url,
      flags,
      cfg.form === "desktop" ? desktopConfig : undefined,
      page,
    );
    if (!result) throw new Error("lighthouse returned no result");

    const applied = await page
      .evaluate(() => ({
        href: location.href,
        skin: document.documentElement.dataset.skin ?? null,
        dark: document.documentElement.classList.contains("dark"),
        light: document.documentElement.classList.contains("light"),
      }))
      .catch(() => null);
    const modeApplied = applied ? (applied.dark ? "dark" : applied.light ? "light" : null) : null;
    const verified =
      !!applied && applied.skin === cfg.skin && modeApplied === cfg.mode && applied.href.startsWith(url);

    return { lhr: result.lhr, verified, applied };
  } finally {
    await browser.close();
  }
}

async function main() {
  if (!flag("skip-build")) await build();
  const stop = await start();
  try {
    // Warm the server (module graph, i18n catalogs) so run 1 is not an outlier.
    for (const l of LOCALES) await fetch(`${BASE_URL}/${l}`).then((r) => r.arrayBuffer());

    await mkdir(path.join(OUT_DIR, "raw"), { recursive: true });
    const runs = [];
    // Round-robin over configs so slow machine drift hits every config equally.
    for (let rep = 1; rep <= RUNS; rep++) {
      for (const cfg of configs) {
        const t0 = Date.now();
        let slim;
        try {
          const { lhr, verified, applied } = await runOnce(cfg, THROTTLING ? { throttlingMethod: THROTTLING } : {});
          await writeFile(
            path.join(OUT_DIR, "raw", `${cfg.id}-${rep}.json`),
            JSON.stringify(lhr),
          );
          slim = { ...cfg, rep, verified, applied, ...slimRun(lhr) };
          if (!verified)
            console.error(`!! ${cfg.id} #${rep}: theme not applied as requested`, applied);
        } catch (err) {
          console.error(`!! ${cfg.id} #${rep} failed:`, err.message);
          slim = { ...cfg, rep, error: String(err.message) };
        }
        runs.push(slim);
        const s = slim.metrics;
        console.log(
          `${cfg.id} #${rep}  ${((Date.now() - t0) / 1000).toFixed(0)}s` +
            (s
              ? `  perf=${Math.round(slim.score * 100)} LCP=${Math.round(s.lcp)} CLS=${s.cls.toFixed(3)} TBT=${Math.round(s.tbt)}`
              : ""),
        );
      }
    }
    await writeFile(path.join(OUT_DIR, "runs.json"), JSON.stringify(runs, null, 1));
    const md = summarize(runs, { runs: RUNS });
    await writeFile(path.join(OUT_DIR, "summary.md"), md);
    console.log(`\nWrote ${path.join(OUT_DIR, "summary.md")}`);
  } finally {
    stop();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
