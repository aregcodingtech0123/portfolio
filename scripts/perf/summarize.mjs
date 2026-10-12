/**
 * Aggregates per-run Lighthouse results into a markdown report.
 * Also runnable on its own: node scripts/perf/summarize.mjs perf-results/runs.json
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function median(values) {
  const v = values.filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function stats(values) {
  const v = values.filter((x) => x != null && !Number.isNaN(x));
  if (!v.length) return null;
  const med = median(v);
  return { med, min: Math.min(...v), max: Math.max(...v), n: v.length };
}

const ms = (x) => `${Math.round(x)}`;
const kb = (x) => (x / 1024).toFixed(0);
const cls = (x) => (x < 0.0005 ? x.toExponential(1) : x.toFixed(3));

function cell(s, fmt) {
  if (!s) return "n/a";
  return s.min === s.max ? fmt(s.med) : `${fmt(s.med)} (${fmt(s.min)}-${fmt(s.max)})`;
}

/** "img x4, span x1": how often each element was the LCP across the runs. */
function distribution(values) {
  const counts = new Map();
  for (const v of values) {
    const short = v === "none" ? v : v.split(" > ").pop();
    counts.set(short, (counts.get(short) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} x${n}`).join(", ");
}

export function groupRuns(runs) {
  const groups = new Map();
  for (const r of runs) {
    if (!groups.has(r.id)) groups.set(r.id, []);
    groups.get(r.id).push(r);
  }
  return groups;
}

export function summarize(runs) {
  const ok = runs.filter((r) => r.metrics);
  const failed = runs.length - ok.length;
  const unverified = ok.filter((r) => !r.verified).length;
  const out = [];
  out.push(`# Lighthouse baseline\n`);
  out.push(
    `${ok.length} successful runs (${failed} failed, ${unverified} with an unverified skin/mode). ` +
      `Cells are \`median (min-max)\`. Lighthouse ${ok[0]?.lhVersion ?? "?"} (${ok[0]?.throttlingMethod ?? "?"} throttling), ${ok[0]?.userAgent ?? ""}.\n`,
  );
  const groups = groupRuns(ok);
  for (const form of ["mobile", "desktop"]) {
    const rows = [...groups.values()].filter((g) => g[0].form === form);
    if (!rows.length) continue;
    out.push(`\n## ${form}\n`);
    out.push(
      "| locale | skin | mode | n | score | LCP ms | observed LCP ms | FCP ms | TBT ms | TTI ms | CLS | KB transferred | LCP element |",
    );
    out.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for (const g of rows) {
      const col = (pick) => stats(g.map(pick));
      const el = distribution(g.map((r) => r.lcpElement?.selector ?? "none"));
      out.push(
        `| ${g[0].locale} | ${g[0].skin} | ${g[0].mode} | ${g.length} | ` +
          `${cell(col((r) => r.score * 100), ms)} | ` +
          `${cell(col((r) => r.metrics.lcp), ms)} | ` +
          `${cell(col((r) => r.metrics.observedLcp), ms)} | ` +
          `${cell(col((r) => r.metrics.fcp), ms)} | ` +
          `${cell(col((r) => r.metrics.tbt), ms)} | ` +
          `${cell(col((r) => r.metrics.tti), ms)} | ` +
          `${cell(col((r) => r.metrics.cls), cls)} | ` +
          `${cell(col((r) => r.metrics.bytes), kb)} | ` +
          `\`${el}\` |`,
      );
    }
  }
  const bench = stats(ok.map((r) => r.benchmarkIndex));
  if (bench)
    out.push(
      `\nLighthouse CPU BenchmarkIndex on this machine: median ${Math.round(bench.med)} ` +
        `(${Math.round(bench.min)}-${Math.round(bench.max)}). Lighthouse's own reference for a mid-tier phone is roughly 1000 or lower, ` +
        `so the fixed 4x slowdown used for mobile is optimistic on this machine.`,
    );
  return out.join("\n") + "\n";
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const runs = JSON.parse(await readFile(process.argv[2] ?? "perf-results/runs.json", "utf8"));
  process.stdout.write(summarize(runs));
}
