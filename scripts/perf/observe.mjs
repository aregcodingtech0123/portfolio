/**
 * Real-browser observer. Complements Lighthouse, which runs in "simulate"
 * mode (it loads unthrottled, then models a slow device) and cannot see
 * interaction latency.
 *
 * For each skin x mode (and both locales) this loads the production build with
 * *applied* throttling (CDP network + CPU, the same Slow 4G / 4x CPU numbers
 * Lighthouse's mobile profile uses) and records, straight from the browser's
 * PerformanceObserver APIs:
 *   - every LCP candidate (element, URL, size, time) - the final one is the LCP
 *   - every layout shift with its source nodes
 *   - long tasks
 *   - event timing for scripted interactions (the INP ingredients)
 *
 *   npm run perf:observe -- --runs 3 [--skip-build]
 *
 * Same isolation as the Lighthouse runner: seed localStorage before load and
 * block every non-localhost hostname at the resolver.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { BASE_URL } from "./env.mjs";
import { build, start } from "./server.mjs";
import { median } from "./summarize.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const RUNS = Number(arg("runs", 3));
const OUT_DIR = path.resolve(arg("out", "perf-results"));
const LOCALES = arg("locale", "en,tr").split(",");
const FORMS = arg("form", "mobile,desktop").split(",");

const PROFILES = {
  mobile: {
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
    // Lighthouse mobile "Slow 4G": 150 ms RTT, 1.6 Mbps down, 750 kbps up, 4x CPU.
    net: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
    cpu: 4,
  },
  desktop: {
    viewport: { width: 1350, height: 940 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    net: { latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (10 * 1024 * 1024) / 8 },
    cpu: 1,
  },
};

/** Runs inside the page before any app script. */
function installObservers() {
  const w = window;
  w.__perf = { lcp: [], shifts: [], longTasks: [], events: [] };
  const path = (el) => {
    if (!el || el.nodeType !== 1) return null;
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && parts.length < 5; n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) s += `#${n.id}`;
      else if (typeof n.className === "string" && n.className.trim())
        s += `.${n.className.trim().split(/\s+/)[0]}`;
      parts.unshift(s);
      if (n.id) break;
    }
    return parts.join(" > ");
  };
  const observe = (type, cb, extra = {}) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(cb)).observe({
        type,
        buffered: true,
        ...extra,
      });
    } catch {
      /* type unsupported */
    }
  };
  observe("largest-contentful-paint", (e) =>
    w.__perf.lcp.push({
      t: Math.round(e.startTime),
      size: e.size,
      url: e.url || null,
      el: path(e.element),
      tag: e.element?.tagName ?? null,
    }),
  );
  observe("layout-shift", (e) =>
    w.__perf.shifts.push({
      t: Math.round(e.startTime),
      value: e.value,
      input: e.hadRecentInput,
      sources: (e.sources || []).map((s) => ({
        el: path(s.node),
        from: s.previousRect && [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height].map(Math.round),
        to: s.currentRect && [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height].map(Math.round),
      })),
    }),
  );
  observe("longtask", (e) =>
    w.__perf.longTasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }),
  );
  observe(
    "event",
    (e) => {
      if (e.interactionId)
        w.__perf.events.push({
          name: e.name,
          start: Math.round(e.startTime),
          input: Math.round(e.processingStart - e.startTime),
          processing: Math.round(e.processingEnd - e.processingStart),
          duration: e.duration,
          target: path(e.target),
        });
    },
    { durationThreshold: 16 },
  );
}

async function interact(page, label, fn) {
  const before = await page.evaluate(() => window.__perf.events.length);
  try {
    await fn();
  } catch (err) {
    return { label, error: String(err.message).split("\n")[0] };
  }
  await page.waitForTimeout(700); // event timing is reported after the next frame
  const events = await page.evaluate((n) => window.__perf.events.slice(n), before);
  const worst = events.reduce((m, e) => Math.max(m, e.duration), 0);
  return { label, worst, events };
}

async function runOnce(browser, cfg) {
  const p = PROFILES[cfg.form];
  const context = await browser.newContext({
    viewport: p.viewport,
    deviceScaleFactor: p.deviceScaleFactor,
    isMobile: p.isMobile,
    hasTouch: p.hasTouch,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.addInitScript(
    ({ mode, skin }) => {
      try {
        localStorage.setItem("theme", mode);
        localStorage.setItem("skin", skin);
      } catch {}
    },
    { mode: cfg.mode, skin: cfg.skin },
  );
  await page.addInitScript(installObservers);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...p.net });
  if (p.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });

  const failed = [];
  page.on("requestfailed", (r) => failed.push(r.url()));

  await page.goto(`${BASE_URL}/${cfg.locale}`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  const applied = await page.evaluate(() => ({
    skin: document.documentElement.dataset.skin,
    dark: document.documentElement.classList.contains("dark"),
  }));
  const loadMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = Object.fromEntries(
      performance.getEntriesByType("paint").map((e) => [e.name, Math.round(e.startTime)]),
    );
    return {
      ttfb: Math.round(nav.responseStart),
      domInteractive: Math.round(nav.domInteractive),
      load: Math.round(nav.loadEventEnd),
      fcp: paint["first-contentful-paint"] ?? null,
      lcp: window.__perf.lcp,
      shifts: window.__perf.shifts,
      longTasks: window.__perf.longTasks,
    };
  });

  // Scripted interactions (event timing). Uses the control the active skin shows.
  const interactions = [];
  const card = page.locator('button[aria-label^="View project details"]:visible').first();
  interactions.push(
    await interact(page, "open project modal", async () => {
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.getByRole("dialog").waitFor({ state: "visible" });
    }),
  );
  interactions.push(
    await interact(page, "close project modal (Esc)", async () => {
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    }),
  );
  interactions.push(
    await interact(page, "switch skin", async () => {
      const trigger = page
        .locator('button[aria-haspopup="listbox"]:visible')
        .filter({ hasText: /Terminal|Minimal|Sade/i })
        .first();
      await trigger.click();
      await page
        .getByRole("option", { name: cfg.skin === "terminal" ? /Minimal|Sade/i : /Terminal/i })
        .first()
        .click();
    }),
  );
  const postShifts = await page.evaluate(() => window.__perf.shifts);

  await context.close();
  return { ...cfg, applied, ...loadMetrics, interactions, postInteractionShifts: postShifts, failed };
}

async function main() {
  if (process.argv.includes("--skip-build") === false) await build();
  const stop = await start();
  const browser = await chromium.launch({
    args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost"],
  });
  const runs = [];
  try {
    for (const l of LOCALES) await fetch(`${BASE_URL}/${l}`).then((r) => r.arrayBuffer());
    for (let rep = 1; rep <= RUNS; rep++) {
      for (const form of FORMS)
        for (const locale of LOCALES)
          for (const skin of ["terminal", "minimal"])
            for (const mode of ["dark", "light"]) {
              const cfg = { id: `${form}-${locale}-${skin}-${mode}`, form, locale, skin, mode, rep };
              try {
                const r = await runOnce(browser, cfg);
                const last = r.lcp.at(-1);
                const ok = r.applied.skin === skin && r.applied.dark === (mode === "dark");
                console.log(
                  `${cfg.id} #${rep} LCP=${last?.t}ms ${last?.tag} ${last?.url ? "(img)" : ""} ` +
                    `shifts=${r.shifts.length} longTasks=${r.longTasks.length}${ok ? "" : "  THEME NOT APPLIED"}`,
                );
                runs.push({ ...r, verified: ok });
              } catch (err) {
                console.error(`!! ${cfg.id} #${rep}`, err.message);
                runs.push({ ...cfg, error: err.message });
              }
            }
    }
  } finally {
    await browser.close();
    stop();
  }
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "observe.json"), JSON.stringify(runs, null, 1));
  void median;
  console.log(`\nWrote ${path.join(OUT_DIR, "observe.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
