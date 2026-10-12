/**
 * JavaScript bundle report for the production build.
 *
 *   npm run perf:bundle [-- --skip-analyze] [--out perf-results]
 *
 * Two sources, because neither is enough alone:
 *  1. The real first-load JS of each route: fetched from the running
 *     production server's HTML (<script src>), then every chunk is read from
 *     .next/static and measured raw, gzip and brotli. This is what a visitor
 *     downloads. (Turbopack builds print no per-route size table.)
 *  2. `next experimental-analyze --output`: a Turbopack module-level dump that
 *     says which source file/package each byte of each client chunk came from.
 *     Its chunk names differ from the real build's, so chunks are matched by
 *     minified size (they agree within ~1%).
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { BASE_URL, perfEnv } from "./env.mjs";
import { start } from "./server.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const ANALYZE_DIR = path.resolve(".next/diagnostics/analyze/data");
const CHUNK_DIR = path.resolve(".next/static/chunks");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const OUT_DIR = path.resolve(arg("out", "perf-results"));

function runAnalyze() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, "experimental-analyze", "--output"], {
      env: { ...process.env, ...perfEnv },
      stdio: "inherit",
    });
    child.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(`analyze exited ${c}`))));
  });
}

async function readAnalyze(file) {
  const buf = await readFile(file);
  const len = buf.readUInt32BE(0);
  const j = JSON.parse(buf.subarray(4, 4 + len).toString("utf8"));
  const fullPath = (i) => {
    const parts = [];
    for (let n = i; n != null; n = j.sources[n].parent_source_index) parts.unshift(j.sources[n].path);
    return parts.join("/").replace(/\/+/g, "/");
  };
  return { j, fullPath };
}

function packageOf(p) {
  // <script nomodule>: legacy-browser fallback, never downloaded by a modern browser.
  if (p.includes("next/dist/build/polyfills/polyfill-nomodule")) return "next (nomodule polyfill, not downloaded)";
  // Next vendors React/ReactDOM and others under next/dist/compiled; split them
  // out so "next" does not swallow the ~500 KB of react-dom.
  const compiled = p.match(/node_modules\/next\/dist\/compiled\/((?:@[^/]+\/)?[^/]+)/);
  if (compiled) return `next (vendored ${compiled[1]})`;
  if (/node_modules\/next\/dist\//.test(p)) return "next (client runtime)";
  const m = [...p.matchAll(/node_modules\/((?:@[^/]+\/)?[^/]+)/g)].pop();
  if (m) return m[1];
  const app = p.match(/\[project\]\/(src|sanity)\/([^/]+)(?:\/([^/]+))?/);
  if (app) return `(app) ${app[1]}/${app[2]}${app[3] && app[2] === "components" ? "/" + app[3] : ""}`;
  return `(other) ${p.split("/").slice(0, 3).join("/")}`;
}

/** Sum minified bytes by package for every client JS chunk of one route dump. */
async function composition(routeDir) {
  const { j, fullPath } = await readAnalyze(path.join(ANALYZE_DIR, routeDir, "analyze.data"));
  const files = j.output_files.map((f, i) => ({ i, name: f.filename }));
  const clientJs = new Map(
    files.filter((f) => /\[client-fs\]\/_next\/static\/chunks\/.*\.js$/.test(f.name)).map((f) => [f.i, f.name]),
  );
  const pathCache = new Map();
  const byPkg = new Map();
  const byModule = new Map();
  const byChunk = new Map();
  const chunkSize = new Map();
  for (const p of j.chunk_parts) {
    if (!clientJs.has(p.output_file_index)) continue;
    if (!pathCache.has(p.source_index)) pathCache.set(p.source_index, packageOf(fullPath(p.source_index)));
    const pkg = pathCache.get(p.source_index);
    const mod = fullPath(p.source_index).replace(/^\[project\]\//, "");
    byModule.set(mod, (byModule.get(mod) ?? 0) + p.size);
    const cname = clientJs.get(p.output_file_index).split("/").pop();
    const cm = byChunk.get(cname) ?? new Map();
    cm.set(pkg, (cm.get(pkg) ?? 0) + p.size);
    byChunk.set(cname, cm);
    const e = byPkg.get(pkg) ?? { raw: 0, gz: 0, chunks: new Set() };
    e.raw += p.size;
    e.gz += p.compressed_size;
    e.chunks.add(clientJs.get(p.output_file_index).split("/").pop());
    byPkg.set(pkg, e);
    chunkSize.set(p.output_file_index, (chunkSize.get(p.output_file_index) ?? 0) + p.size);
  }
  return {
    byPkg,
    byModule,
    byChunk,
    chunks: [...chunkSize].map(([i, size]) => ({ name: clientJs.get(i).split("/").pop(), size })),
  };
}

/** Initial JS of a route as the browser requests it: <script src> in the HTML. */
async function firstLoad(urlPath) {
  const res = await fetch(`${BASE_URL}${urlPath}`);
  const html = await res.text();
  // Preloaded fonts arrive as <link> tags and/or an HTTP Link header, depending on how the page was rendered.
  const preloadSources = [
    ...[...html.matchAll(/<link[^>]*>/g)].map((m) => m[0]).filter((t) => /rel="preload"/.test(t) && /as="font"/.test(t)),
    ...(res.headers.get("link") ?? "").split(/,\s*(?=<)/).filter((p) => /rel="?preload"?/.test(p) && /as="?font"?/.test(p)),
  ];
  const fontHrefs = [
    ...new Set(
      preloadSources.map((p) => (p.match(/href="([^"]+)"/) ?? p.match(/<([^>]+)>/))?.[1]).filter(Boolean),
    ),
  ];
  const preloadedFonts = [];
  for (const href of fontHrefs)
    preloadedFonts.push({
      href,
      bytes: (await stat(path.join(".next", new URL(href, BASE_URL).pathname.replace("/_next/", "")))).size,
    });
  const tags = [...html.matchAll(/<script([^>]*?)\ssrc="([^"]+)"([^>]*)>/g)].map((m) => ({
    src: m[2],
    noModule: /nomodule/i.test(m[1] + m[3]),
  }));
  // nomodule scripts are skipped by every browser that supports ES modules.
  const skipped = tags.filter((t) => t.noModule).map((t) => t.src);
  const srcs = [...new Set(tags.filter((t) => !t.noModule).map((t) => t.src))].filter((s) =>
    s.startsWith("/_next/static/"),
  );
  const files = [];
  for (const s of srcs) {
    const buf = await readFile(path.join(".next", s.replace(/^\/_next\//, "")).split("?")[0]);
    files.push({
      src: s,
      raw: buf.length,
      gz: zlib.gzipSync(buf, { level: 6 }).length,
      br: zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    });
  }
  const sum = (k) => files.reduce((a, f) => a + f[k], 0);
  // CSS delivery: experimental.inlineCss puts the stylesheet in <style> tags; without it there is a render-blocking <link rel="stylesheet">.
  const stylesheetLinks = (html.match(/<link[^>]+rel="stylesheet"[^>]*>/g) ?? []).length;
  const inlineStyleBytes = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((n, m) => n + Buffer.byteLength(m[1]), 0);
  return { urlPath, htmlBytes: Buffer.byteLength(html), stylesheetLinks, inlineStyleBytes, skippedNoModule: skipped, preloadedFonts, cacheControl: res.headers.get("cache-control"), files, raw: sum("raw"), gz: sum("gz"), br: sum("br") };
}

/** Match analyzer chunk -> real chunk by minified size (within 1.5%). */
async function matchReal(chunks, realFiles) {
  const real = [];
  for (const f of await readdir(CHUNK_DIR))
    if (f.endsWith(".js")) real.push({ f, size: (await stat(path.join(CHUNK_DIR, f))).size });
  const out = new Map();
  for (const c of chunks) {
    const hit = real
      .filter((r) => Math.abs(r.size - c.size) / c.size < 0.015)
      .sort((a, b) => Math.abs(a.size - c.size) - Math.abs(b.size - c.size))[0];
    if (hit) out.set(c.name, hit.f);
  }
  void realFiles;
  return out;
}

const kb = (n) => (n / 1024).toFixed(1);

async function main() {
  if (!process.argv.includes("--skip-analyze")) await runAnalyze();
  const stop = await start();
  const md = [];
  try {
    const routes = [
      ["/en", "/[locale]"],
      ["/tr", "/[locale]"],
      ["/en/this-route-does-not-exist", "/[locale]/not-found"],
      ["/content-hub", "/content-hub/[[...tool]]"],
    ];
    const loads = [];
    for (const [url] of routes) loads.push(await firstLoad(url));

    md.push("# Bundle report\n");
    md.push("## First-load JS per route (what the browser downloads)\n");
    md.push("| route | HTML | scripts | raw KB | gzip KB | brotli KB |");
    md.push("|---|---|---|---|---|---|");
    for (const l of loads)
      md.push(`| ${l.urlPath} | ${kb(l.htmlBytes)} KB | ${l.files.length} | ${kb(l.raw)} | ${kb(l.gz)} | ${kb(l.br)} |`);

    const pub = await composition("[locale]");
    const hub = await composition("content-hub/[[...tool]]");
    const notFound = await composition("_not-found");
    const realMap = await matchReal(pub.chunks);
    const publicReal = new Set(loads[0].files.map((f) => f.src.split("/").pop()));
    // Only chunks the HTML actually requests count as first-load; the rest are lazy.
    const firstLoadChunks = new Set(
      [...realMap].filter(([, real]) => publicReal.has(real)).map(([name]) => name),
    );

    md.push("\n## /[locale] (public page): client JS by package\n");
    md.push("Minified bytes per package across every client JS chunk of the route; `first-load` marks chunks present in the HTML.\n");
    md.push("| package | raw KB | gzip KB (est.) | in first-load chunks |");
    md.push("|---|---|---|---|");
    const rows = [...pub.byPkg].sort((a, b) => b[1].raw - a[1].raw);
    for (const [pkg, e] of rows.slice(0, 40)) {
      const inFirst = [...e.chunks].some((c) => firstLoadChunks.has(c));
      md.push(`| ${pkg} | ${kb(e.raw)} | ${kb(e.gz)} | ${inFirst ? "yes" : "no"} |`);
    }
    const total = rows.reduce((a, [, e]) => a + e.raw, 0);
    md.push(`\nTotal client JS in route: ${kb(total)} KB raw across ${pub.chunks.length} chunks.`);

    md.push("\n### First-load chunks and what is inside them\n");
    md.push("| real chunk | raw KB | gzip KB | main contents (raw KB) |");
    md.push("|---|---|---|---|");
    for (const f of [...loads[0].files].sort((a, b) => b.raw - a.raw)) {
      const name = f.src.split("/").pop();
      const analyzerName = [...realMap].find(([, real]) => real === name)?.[0];
      const parts = analyzerName
        ? [...pub.byChunk.get(analyzerName)]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k, v]) => `${k} ${kb(v)}`)
            .join("; ")
        : "(no analyzer match)";
      md.push(`| ${name} | ${kb(f.raw)} | ${kb(f.gz)} | ${parts} |`);
    }

    md.push("\n### Largest individual modules in the route\n");
    md.push("| module | raw KB |");
    md.push("|---|---|");
    for (const [mod, size] of [...pub.byModule].sort((a, b) => b[1] - a[1]).slice(0, 25))
      md.push(`| ${mod} | ${kb(size)} |`);

    // Heavy-hitters the brief asks about, and Studio/Gemini leak check.
    const watch = [
      "framer-motion",
      "motion-dom",
      "motion-utils",
      "next-intl",
      "use-intl",
      "@marsidev/react-turnstile",
      "@google/genai",
      "@emailjs/browser",
      "lucide-react",
      "react-icons",
      "next-sanity",
      "@sanity/client",
      "@sanity/image-url",
      "@sanity/ui",
      "@sanity/vision",
      "sanity",
      "styled-components",
      "next (vendored react-dom)",
      "next (vendored react)",
      "next (client runtime)",
    ];
    md.push("\n### Watched packages in the public route\n");
    md.push("| package | raw KB | gzip KB (est.) | in first-load | also in /content-hub |");
    md.push("|---|---|---|---|---|");
    for (const w of watch) {
      const e = pub.byPkg.get(w);
      const inHub = hub.byPkg.has(w);
      md.push(
        e
          ? `| ${w} | ${kb(e.raw)} | ${kb(e.gz)} | ${[...e.chunks].some((c) => firstLoadChunks.has(c)) ? "yes" : "no"} | ${inHub ? "yes" : "no"} |`
          : `| ${w} | 0 | 0 | no | ${inHub ? "yes" : "no"} |`,
      );
    }
    const leaks = [...pub.byPkg.keys()].filter((p) => /^(sanity|@sanity\/(ui|vision|icons|client)|@google\/genai|next-sanity)$/.test(p));
    md.push(`\nStudio/Gemini/Sanity packages found in public client chunks: ${leaks.length ? leaks.join(", ") : "none"}.`);

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "bundle.md"), md.join("\n") + "\n");
    await writeFile(
      path.join(OUT_DIR, "bundle.json"),
      JSON.stringify(
        {
          loads,
          publicPackages: Object.fromEntries(
            [...pub.byPkg].map(([k, v]) => [k, { raw: v.raw, gz: v.gz, chunks: [...v.chunks] }]),
          ),
          notFoundPackages: Object.fromEntries([...notFound.byPkg].map(([k, v]) => [k, { raw: v.raw, gz: v.gz }])),
          hubPackages: Object.fromEntries([...hub.byPkg].map(([k, v]) => [k, { raw: v.raw, gz: v.gz }])),
        },
        null,
        1,
      ),
    );
    console.log(md.join("\n"));
  } finally {
    stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
