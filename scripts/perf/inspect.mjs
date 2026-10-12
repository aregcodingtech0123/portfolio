/**
 * Static-cost inspector: fonts, images, CSS, duplicated DOM and main-thread
 * attribution, measured in a real Chromium against the production build.
 *
 *   npm run perf:inspect [-- --skip-build]
 *
 * Per locale x skin (dark mode) it records:
 *   - which @font-face files the page actually USES (FontFace.status), versus
 *     which were fetched (resource timing)
 *   - every <img>: natural size, rendered size, bytes, whether it is visible
 *   - the stylesheet split into skin-scoped and shared bytes, plus how much of
 *     it is used on load and after a full scroll (CSS coverage)
 *   - DOM size and how much of it sits in display:none subtrees
 *   - JS coverage per script, load vs after scroll/interaction
 *   - a V8 CPU profile of a 4x-throttled load, self time per script URL
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { BASE_URL } from "./env.mjs";
import { build, start } from "./server.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const OUT_DIR = path.resolve(arg("out", "perf-results"));

const VIEWPORTS = {
  desktop: { viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true },
};

/** Paint covered ranges so nested/overlapping V8 ranges resolve correctly. */
function usedBytes(entry) {
  const len = entry.source?.length ?? 0;
  const mark = new Uint8Array(len);
  const ranges = entry.functions.flatMap((f) => f.ranges).sort((a, b) => b.endOffset - b.startOffset - (a.endOffset - a.startOffset));
  for (const r of ranges) mark.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset);
  let used = 0;
  for (const m of mark) used += m;
  return { total: len, used };
}

async function pageFacts() {
  return await (async () => {
    const out = {};
    out.fonts = [...document.fonts].map((f) => ({
      family: f.family.replace(/"/g, ""),
      weight: f.weight,
      range: f.unicodeRange.slice(0, 40),
      status: f.status,
    }));
    const rect = (el) => el.getBoundingClientRect();
    const visible = (el) => {
      for (let n = el; n; n = n.parentElement) if (getComputedStyle(n).display === "none") return false;
      return true;
    };
    const res = performance.getEntriesByType("resource");
    out.images = [...document.images].map((img) => {
      const r = rect(img);
      const entry = res.find((e) => e.name === img.currentSrc);
      return {
        src: (img.currentSrc || img.src).replace(location.origin, ""),
        natural: [img.naturalWidth, img.naturalHeight],
        rendered: [Math.round(r.width), Math.round(r.height)],
        dpr: devicePixelRatio,
        visible: visible(img),
        loading: img.loading,
        fetchPriority: img.fetchPriority,
        sizes: img.sizes || null,
        transfer: entry?.transferSize ?? null,
        encoded: entry?.encodedBodySize ?? null,
      };
    });
    out.resources = res
      .filter((e) => /\.(woff2?|jpe?g|png|webp|avif|svg)(\?|$)|_next\/image/.test(e.name))
      .map((e) => ({ url: e.name.replace(location.origin, ""), transfer: e.transferSize, encoded: e.encodedBodySize }));

    // DOM and duplicated-by-skin markup
    const all = document.body.querySelectorAll("*");
    let hiddenRoots = 0;
    let hiddenElements = 0;
    let hiddenHtml = 0;
    const walk = (el) => {
      if (getComputedStyle(el).display === "none") {
        hiddenRoots++;
        hiddenElements += 1 + el.querySelectorAll("*").length;
        hiddenHtml += el.outerHTML.length;
        return;
      }
      for (const c of el.children) walk(c);
    };
    for (const c of document.body.children) walk(c);
    out.dom = {
      elements: all.length,
      hiddenRoots,
      hiddenElements,
      hiddenHtmlBytes: hiddenHtml,
      htmlBytes: document.documentElement.outerHTML.length,
      maxDepth: Math.max(...[...all].map((e) => { let d = 0; for (let n = e; n; n = n.parentElement) d++; return d; })),
    };

    // Stylesheet split by skin scope.
    let bytes = { minimal: 0, terminal: 0, shared: 0 };
    const visit = (rules) => {
      for (const r of rules) {
        const text = r.cssText;
        if (r.cssRules && !r.selectorText && !r.name) {
          // @media/@supports/@layer wrappers: classify their children instead
          visit(r.cssRules);
          continue;
        }
        const sel = r.selectorText ?? "";
        if (/data-skin=["']?minimal/.test(sel)) bytes.minimal += text.length;
        else if (/data-skin=["']?terminal/.test(sel)) bytes.terminal += text.length;
        else bytes.shared += text.length;
      }
    };
    for (const sheet of document.styleSheets) {
      try {
        visit(sheet.cssRules);
      } catch {
        /* cross-origin sheet */
      }
    }
    out.cssByScope = bytes;
    out.themeApplied = { skin: document.documentElement.dataset.skin, cls: document.documentElement.className.split(" ").filter((c) => c === "dark" || c === "light") };
    return out;
  })();
}

async function inspectOne(browser, cfg) {
  const vp = VIEWPORTS[cfg.form];
  const context = await browser.newContext(vp);
  const page = await context.newPage();
  await page.addInitScript(
    ({ mode, skin }) => {
      try {
        localStorage.setItem("theme", mode);
        localStorage.setItem("skin", skin);
      } catch {}
    },
    { mode: "dark", skin: cfg.skin },
  );
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.goto(`${BASE_URL}/${cfg.locale}`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  const loadCss = await page.coverage.stopCSSCoverage();
  const loadJs = await page.coverage.stopJSCoverage();
  const facts = await page.evaluate(pageFacts);

  // Second pass: scroll the whole page, open and close a project modal.
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += vp.viewport.height / 2) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  const card = page.locator('button[aria-label^="View project details"]:visible').first();
  try {
    await card.scrollIntoViewIfNeeded({ timeout: 3000 });
    await card.click({ timeout: 3000 });
    await page.getByRole("dialog").waitFor({ state: "visible", timeout: 3000 });
    await page.keyboard.press("Escape");
  } catch {
    /* modal not reachable in this config */
  }
  await page.waitForTimeout(500);
  const scrollCss = await page.coverage.stopCSSCoverage();
  const scrollJs = await page.coverage.stopJSCoverage();

  const cssTotal = loadCss.reduce((a, e) => a + e.text.length, 0);
  const cssUsedLoad = loadCss.reduce((a, e) => a + e.ranges.reduce((s, r) => s + r.end - r.start, 0), 0);
  // Ranges after the scroll pass are a fresh recording: union with the load pass.
  const cssUsedUnion = loadCss.reduce((a, e) => {
    const len = e.text.length;
    const mark = new Uint8Array(len);
    for (const r of e.ranges) mark.fill(1, r.start, r.end);
    const later = scrollCss.find((s) => s.url === e.url);
    for (const r of later?.ranges ?? []) mark.fill(1, r.start, r.end);
    return a + mark.reduce((s, m) => s + m, 0);
  }, 0);

  const js = loadJs
    .filter((e) => e.url.includes("/_next/static/"))
    .map((e) => {
      const base = { url: e.url.replace(BASE_URL, ""), ...usedBytes(e) };
      const later = scrollJs.find((s) => s.url === e.url);
      return { ...base, usedAfterScroll: later ? usedBytes(later).used : null };
    });

  await context.close();
  return {
    ...cfg,
    ...facts,
    css: { total: cssTotal, usedOnLoad: cssUsedLoad, usedAfterScroll: cssUsedUnion },
    js,
  };
}

/** CPU profile of a CPU-throttled load: self time per script URL. */
async function profileLoad(browser, cfg) {
  const vp = VIEWPORTS.mobile;
  const context = await browser.newContext(vp);
  const page = await context.newPage();
  await page.addInitScript(
    ({ mode, skin }) => {
      try {
        localStorage.setItem("theme", mode);
        localStorage.setItem("skin", skin);
      } catch {}
    },
    { mode: "dark", skin: cfg.skin },
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  await cdp.send("Profiler.start");
  await page.goto(`${BASE_URL}/${cfg.locale}`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  const { profile } = await cdp.send("Profiler.stop");
  await context.close();

  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const funcs = new Map();
  const dt = profile.timeDeltas;
  profile.samples.forEach((id, i) => {
    const n = byId.get(id);
    const t = (dt[i] ?? 0) / 1000;
    const url = n.callFrame.url ? n.callFrame.url.replace(BASE_URL, "") : `(${n.callFrame.functionName || "native"})`;
    self.set(url, (self.get(url) ?? 0) + t);
    const key = `${url}:${n.callFrame.functionName || "anon"}:${n.callFrame.lineNumber}:${n.callFrame.columnNumber}`;
    funcs.set(key, (funcs.get(key) ?? 0) + t);
  });
  const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, Math.round(v)]);
  return { skin: cfg.skin, locale: cfg.locale, selfMsByUrl: top(self, 25), topFunctions: top(funcs, 25) };
}

async function main() {
  if (!process.argv.includes("--skip-build")) await build();
  const stop = await start();
  const browser = await chromium.launch({
    args: ["--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost"],
  });
  const results = { pages: [], profiles: [] };
  try {
    for (const l of ["en", "tr"]) await fetch(`${BASE_URL}/${l}`).then((r) => r.arrayBuffer());
    for (const form of ["desktop", "mobile"])
      for (const locale of ["en", "tr"])
        for (const skin of ["terminal", "minimal"]) {
          const r = await inspectOne(browser, { form, locale, skin });
          results.pages.push(r);
          console.log(`inspected ${form}/${locale}/${skin}: ${r.dom.elements} elements, ${r.dom.hiddenElements} hidden`);
        }
    for (const skin of ["terminal", "minimal"]) results.profiles.push(await profileLoad(browser, { locale: "en", skin }));
  } finally {
    await browser.close();
    stop();
  }
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "inspect.json"), JSON.stringify(results, null, 1));
  console.log(`Wrote ${path.join(OUT_DIR, "inspect.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
