// Fails if any copy file contains an em dash (U+2014) or a TODO-style placeholder.
// Copy lives in messages/, the fallback data, the seed script, and Sanity schema descriptions.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

// cwd, not a URL derived from import.meta.url: both real invocations (the
// CLI via `node scripts/check-copy.mjs` and `npm test` via Vitest) run from
// the repo root, and Vitest's jsdom environment does not give imported
// (non-entry) .mjs modules a real file:// import.meta.url to build a URL from.
const ROOT = process.cwd();
export const EM_DASH = "—";
export const TODO_PATTERN = /\[TODO\b|TODO:/;

export function walk(dir, predicate, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

export function defaultFiles(root = ROOT) {
  return [
    ...walk(join(root, "messages"), (f) => f.endsWith(".json")),
    ...walk(join(root, "sanity", "schemaTypes"), (f) => f.endsWith(".ts")),
    join(root, "src", "data", "migration-portfolio.ts"),
    join(root, "scripts", "seed-sanity.ts"),
  ];
}

/** Pure: scans one file's content for violations. No I/O, no process side effects. */
export function scanContent(content, relPath) {
  const emDash = [];
  const todo = [];
  content.split(/\r?\n/).forEach((line, i) => {
    const loc = `${relPath}:${i + 1}: ${line.trim().slice(0, 120)}`;
    if (line.includes(EM_DASH)) emDash.push(loc);
    if (TODO_PATTERN.test(line)) todo.push(loc);
  });
  return { emDash, todo };
}

/**
 * Reads and scans each file in `filePaths`. `root` is only used to shorten
 * the reported paths, so tests can point it at a fixtures directory.
 */
export function evaluateFiles(filePaths, root = ROOT) {
  const emDashFailures = [];
  const todoFailures = [];
  for (const file of filePaths) {
    const relPath = relative(root, file);
    const { emDash, todo } = scanContent(readFileSync(file, "utf8"), relPath);
    emDashFailures.push(...emDash);
    todoFailures.push(...todo);
  }
  return {
    emDashFailures,
    todoFailures,
    failed: emDashFailures.length > 0 || todoFailures.length > 0,
  };
}

function printReport(result, fileCount) {
  if (result.emDashFailures.length) {
    console.error(
      `Em dashes found in copy (${result.emDashFailures.length}). Use commas, colons or full stops instead:`,
    );
    result.emDashFailures.forEach((f) => console.error("  " + f));
  }
  if (result.todoFailures.length) {
    console.error(
      `TODO placeholders found in copy (${result.todoFailures.length}). Leave fields empty instead of seeding hints:`,
    );
    result.todoFailures.forEach((f) => console.error("  " + f));
  }
  if (result.failed) return;
  console.log(
    `check:copy passed (${fileCount} files, no em dashes, no TODO placeholders)`,
  );
}

// Guards the real scan + process.exit behind "are we actually run as a CLI",
// so importing this module from a test never scans the repo or kills the runner.
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const files = defaultFiles();
  const result = evaluateFiles(files);
  printReport(result, files.length);
  if (result.failed) process.exit(1);
}
