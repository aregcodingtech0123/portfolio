/**
 * Performance budget check. Fails (exit 1) when a measured value is over the
 * limit in scripts/perf/budget.json.
 *
 *   npm run perf:budget                    # build, then both stages
 *   npm run perf:budget -- --only bundle   # cheap, deterministic, no browser timing
 *   npm run perf:budget -- --only lighthouse
 *   npm run perf:budget -- --skip-build    # reuse .next (CI does, after e2e)
 *   npm run perf:budget -- --budget path/to/other.json   # e.g. to prove a breach fails
 *
 * Two stages with different cost and trust:
 *  - bundle: first-load JS per route (gzip), public chunks free of Sanity
 *    Studio / Gemini code, preloaded font bytes, page cacheability. Reads the
 *    build output and the served HTML. About 40 s, no timing, fully
 *    deterministic: safe to gate every push.
 *  - lighthouse: a reduced matrix (see budget.json), median of a few runs,
 *    against score, LCP, FCP, TBT, CLS, transferred bytes and the largest
 *    image. Slower (~2 min) and timing-based, so thresholds carry headroom.
 *
 * Same isolation as the rest of scripts/perf: production build, localhost only.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { BASE_URL } from "./env.mjs";
import { build, start } from "./server.mjs";
import { slimRun } from "./extract.mjs";
import { median } from "./summarize.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const flag = (name) => process.argv.includes(`--${name}`);

const BUDGET_PATH = path.resolve(arg("budget", "scripts/perf/budget.json"));
const OUT_DIR = path.resolve(arg("out", "perf-results/budget"));
const only = arg("only", "all");

const rows = [];
/** Records one check. `limit` is a ceiling unless `floor` is true. */
function check(group, name, value, limit, unit, { floor = false } = {}) {
  const pass = floor ? value >= limit : value <= limit;
  rows.push({ group, name, value, limit, unit, floor, pass });
}
/**
 * Per Lighthouse config: the elements that shifted, so a CLS failure explains
 * itself (CI prints budget.md; the full reports are in OUT_DIR/lighthouse).
 */
const shiftReport = [];

/** Lighthouse's layout-shifts audit, reduced to selector, score and cause. */
function layoutShifts(lhr) {
  return (lhr.audits["layout-shifts"]?.details?.items ?? []).map((item) => ({
    selector: item.node?.selector ?? item.node?.snippet ?? "(unknown)",
    score: item.score ?? 0,
    cause: [...new Set((item.subItems?.items ?? []).map((s) => s.cause).filter(Boolean))].join("; "),
  }));
}

/**
 * Sources aggregated over a config's runs, largest first: per run, an
 * element's shifts are summed; then the median of those sums over the runs in
 * which it shifted, and in how many runs that was.
 */
function topShiftSources(runs, limit = 5) {
  const bySelector = new Map();
  for (const run of runs) {
    const perRun = new Map();
    for (const shift of run.shifts) {
      const sum = perRun.get(shift.selector) ?? { score: 0, causes: new Set() };
      sum.score += shift.score;
      if (shift.cause) sum.causes.add(shift.cause);
      perRun.set(shift.selector, sum);
    }
    for (const [selector, sum] of perRun) {
      const entry = bySelector.get(selector) ?? { selector, scores: [], causes: new Set() };
      entry.scores.push(sum.score);
      for (const cause of sum.causes) entry.causes.add(cause);
      bySelector.set(selector, entry);
    }
  }
  return [...bySelector.values()]
    .map((e) => ({ selector: e.selector, median: median(e.scores), runs: e.scores.length, causes: [...e.causes].join("; ") }))
    .sort((a, b) => b.median - a.median)
    .slice(0, limit);
}

function checkNone(group, name, found) {
  rows.push({ group, name, value: found.length ? found.join(", ") : "none", limit: "none", unit: "", pass: found.length === 0 });
}

function runBundleReport(outDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve("scripts/perf/bundle.mjs"), "--out", outDir], {
      stdio: ["ignore", "ignore", "inherit"],
    });
    child.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`bundle report exited ${c}`))));
  });
}

async function bundleStage(budget) {
  const b = budget.bundle;
  const dir = path.join(OUT_DIR, "bundle");
  await mkdir(dir, { recursive: true });
  await runBundleReport(dir);
  const data = JSON.parse(await readFile(path.join(dir, "bundle.json"), "utf8"));
  const load = (p) => data.loads.find((l) => l.urlPath === p);
  const kb = (n) => n / 1024;

  for (const [route, limit] of Object.entries(b.firstLoadGzipKB)) {
    const l = load(route);
    check("bundle", `first-load JS gzip, ${route}`, kb(l.gz), limit, "KB");
  }
  check("bundle", "first-load JS raw, /en", kb(load("/en").raw), b.firstLoadRawKB, "KB");
  check(
    "bundle",
    "fonts preloaded, /en",
    kb(load("/en").preloadedFonts.reduce((a, f) => a + f.bytes, 0)),
    b.preloadedFontsKB,
    "KB",
  );

  if (b.assumeInlineCss) {
    // The mobile score limits were set with experimental.inlineCss on (it is worth
    // about 2-3 score points and ~0.7 s of FCP under applied throttling). Fail
    // here, with the reason, if it has been switched off, instead of letting a
    // later score failure look unexplained.
    const l = load("/en");
    rows.push({
      group: "bundle",
      name: "assumption: experimental.inlineCss is on (CSS inline, no <link rel=stylesheet>)",
      value: `${l.stylesheetLinks} linked stylesheet(s), ${Math.round(kb(l.inlineStyleBytes))} KB inline`,
      limit: "0 linked, CSS inline",
      unit: "",
      pass: l.stylesheetLinks === 0 && l.inlineStyleBytes > 20000,
    });
  }

  const forbidden = new RegExp(b.forbiddenPublicPackages);
  const leaks = new Set();
  for (const set of [data.publicPackages, data.notFoundPackages])
    for (const pkg of Object.keys(set)) if (forbidden.test(pkg)) leaks.add(pkg);
  checkNone("bundle", "Studio / Gemini / Sanity / EmailJS code in public chunks", [...leaks]);

  if (b.pagesMustBeCacheable) {
    const cc = load("/en").cacheControl ?? "";
    rows.push({
      group: "bundle",
      name: "/en is cacheable (no no-store)",
      value: cc || "(none)",
      limit: "no no-store",
      unit: "",
      pass: !/no-store/i.test(cc),
    });
  }
}

async function lighthouseStage(budget) {
  // Imported lazily so `--only bundle` never loads Lighthouse or Chromium.
  const { runOnce } = await import("./lighthouse.mjs");
  const l = budget.lighthouse;
  const stop = await start();
  try {
    for (const loc of new Set(l.configs.map((c) => c.locale)))
      await fetch(`${BASE_URL}/${loc}`).then((r) => r.arrayBuffer());
    // CPU calibration. Lighthouse applies a fixed 4x slowdown on top of the
    // host's own speed, so the same page scores worse on a slow CI runner than
    // on a fast laptop and TBT (and the score it feeds) would flap with the
    // machine, not the code. The budget numbers were set on a machine whose
    // Lighthouse BenchmarkIndex is referenceBenchmarkIndex; on a slower host
    // the artificial slowdown is reduced in proportion so the effective speed
    // matches. A faster host keeps the full 4x (never makes the gate looser).
    const warm = await runOnce({ id: "calibrate", ...l.configs.find((c) => c.form === "mobile") });
    const bench = warm.lhr.environment.benchmarkIndex;
    // Benchmark readings wobble by about 10% on the same machine, so only a
    // clearly slower host (under 80% of the reference) gets a reduced slowdown;
    // otherwise the full 4x applies and identical code is measured identically.
    const cpuSlowdown =
      bench >= 0.8 * l.referenceBenchmarkIndex
        ? 4
        : Math.min(4, Math.max(1, (4 * bench) / l.referenceBenchmarkIndex));
    console.error(`  host BenchmarkIndex ${Math.round(bench)} (reference ${l.referenceBenchmarkIndex}): mobile CPU slowdown ${cpuSlowdown.toFixed(2)}x`);
    // Each config names its throttling method: "devtools" applies Slow 4G and the
    // CPU slowdown to the real load, "simulate" is Lighthouse's default model.
    const flagsFor = (c) => ({
      throttlingMethod: c.throttling ?? "simulate",
      ...(c.form === "mobile" && cpuSlowdown < 4 ? { throttling: { cpuSlowdownMultiplier: cpuSlowdown } } : {}),
    });
    const idOf = (c) => `${c.form}-${c.locale}-${c.skin}-${c.mode}-${c.throttling ?? "simulate"}`;

    const runs = [];
    shiftReport.length = 0;
    const reportDir = path.join(OUT_DIR, "lighthouse");
    await mkdir(reportDir, { recursive: true });
    for (let rep = 1; rep <= l.runs; rep++) {
      for (const c of l.configs) {
        const cfg = { id: idOf(c), ...c };
        const { lhr, verified } = await runOnce(cfg, flagsFor(c));
        if (!verified) throw new Error(`${cfg.id}: skin/mode was not applied as requested`);
        runs.push({ cfg, ...slimRun(lhr), shifts: layoutShifts(lhr) });
        // Full report, for the CI artifact: a CLS or LCP failure on a runner
        // can then be read element by element.
        await writeFile(path.join(reportDir, `${cfg.id}-run${rep}.json`), JSON.stringify(lhr));
        console.error(`  ${cfg.id} #${rep}: score ${Math.round(runs.at(-1).score * 100)}, LCP ${Math.round(runs.at(-1).metrics.lcp)} ms`);
      }
    }
    for (const c of l.configs) {
      const id = idOf(c);
      const mine = runs.filter((r) => r.cfg.id === id);
      const lim = l.limits[c.limits ?? c.form];
      const med = (pick) => median(mine.map(pick));
      const g = `lighthouse ${id} (median of ${mine.length})`;
      check(g, "performance score", med((r) => r.score * 100), lim.score, "", { floor: true });
      check(g, "LCP", med((r) => r.metrics.lcp), lim.lcpMs, "ms");
      check(g, "FCP", med((r) => r.metrics.fcp), lim.fcpMs, "ms");
      check(g, "TBT", med((r) => r.metrics.tbt), lim.tbtMs, "ms");
      check(g, "CLS", med((r) => r.metrics.cls), lim.cls, "");
      shiftReport.push({ id, cls: med((r) => r.metrics.cls), limit: lim.cls, runs: mine.length, sources: topShiftSources(mine) });
      check(g, "transferred", med((r) => r.metrics.bytes) / 1024, lim.transferKB, "KB");
      check(
        g,
        "largest image",
        med((r) => Math.max(0, ...r.requests.filter((q) => q.type === "Image").map((q) => q.transfer))) / 1024,
        lim.maxImageKB,
        "KB",
      );
    }
  } finally {
    stop();
  }
}

function render() {
  const fmt = (v) => (typeof v === "number" ? (Math.abs(v) < 1 && v !== 0 ? v.toFixed(4) : v.toFixed(1)) : String(v));
  const lines = ["| result | check | value | limit |", "|---|---|---|---|"];
  for (const r of rows) {
    lines.push(
      `| ${r.pass ? "PASS" : "**FAIL**"} | ${r.group}: ${r.name} | ${fmt(r.value)}${r.unit ? " " + r.unit : ""} | ${r.floor ? ">= " : r.limit === "none" ? "" : "<= "}${fmt(r.limit)}${r.unit && typeof r.limit === "number" ? " " + r.unit : ""} |`,
    );
  }
  if (shiftReport.length) {
    lines.push("", "Layout shift sources (Lighthouse layout-shifts audit; median score over the runs in which the element shifted):", "");
    for (const r of shiftReport) {
      lines.push(`- ${r.id}: CLS ${fmt(r.cls)} (limit ${fmt(r.limit)})`);
      if (!r.sources.length) lines.push("  - no shifts");
      for (const src of r.sources) {
        lines.push(`  - ${src.median.toFixed(4)} in ${src.runs}/${r.runs} runs: \`${src.selector}\`${src.causes ? ` (${src.causes})` : ""}`);
      }
    }
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const budget = JSON.parse(await readFile(BUDGET_PATH, "utf8"));
  if (!flag("skip-build")) await build();
  // chromium path check up front so a missing browser fails fast and clearly
  if (only !== "bundle") void chromium.executablePath();

  if (only === "all" || only === "bundle") await bundleStage(budget);
  if (only === "all" || only === "lighthouse") {
    await lighthouseStage(budget);
    // The score and the timing metrics move a few points between identical
    // runs even as medians (the terminal skin's applied-throttling score has
    // ranged 87-91 across single runs). If the only things over the limit are
    // those, measure once more and judge the second set; anything deterministic
    // (bytes, CLS, a missing preload, a leak) fails at once.
    const noisy = new Set(["performance score", "LCP", "FCP", "TBT"]);
    const failing = rows.filter((r) => !r.pass && r.group.startsWith("lighthouse"));
    if (failing.length && failing.every((r) => noisy.has(r.name))) {
      console.error(`  ${failing.length} timing-based check(s) over the limit; re-measuring once to rule out noise`);
      for (let i = rows.length - 1; i >= 0; i--) if (rows[i].group.startsWith("lighthouse")) rows.splice(i, 1);
      await lighthouseStage(budget);
    }
  }

  const md = render();
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "budget.md"), md);
  console.log(md);
  const failed = rows.filter((r) => !r.pass);
  for (const r of failed.filter((x) => x.name === "CLS")) {
    const report = shiftReport.find((x) => r.group.includes(x.id));
    console.error(`  ${r.group}: CLS ${r.value.toFixed(4)} over ${r.limit}. Top shifting elements:`);
    for (const src of report?.sources ?? []) {
      console.error(`    ${src.median.toFixed(4)} (${src.runs}/${report.runs} runs) ${src.selector}${src.causes ? ` [${src.causes}]` : ""}`);
    }
  }
  if (failed.length) {
    console.error(`Performance budget FAILED: ${failed.length} of ${rows.length} checks over the limit in ${path.relative(process.cwd(), BUDGET_PATH)}.`);
    process.exit(1);
  }
  console.log(`Performance budget passed: ${rows.length} checks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
