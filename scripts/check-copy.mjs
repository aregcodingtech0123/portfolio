// Fails if any copy file contains an em dash (U+2014).
// Copy lives in messages/, the fallback data and the Sanity schema descriptions.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const EM_DASH = "\u2014";

function walk(dir, predicate, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

const files = [
  ...walk(join(ROOT, "messages"), (f) => f.endsWith(".json")),
  ...walk(join(ROOT, "sanity", "schemaTypes"), (f) => f.endsWith(".ts")),
  join(ROOT, "src", "data", "migration-portfolio.ts"),
];

const failures = [];
for (const file of files) {
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (line.includes(EM_DASH)) {
        failures.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
}

if (failures.length) {
  console.error(`Em dashes found in copy (${failures.length}). Use commas, colons or full stops instead:`);
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
}
console.log(`check:copy passed (${files.length} files, no em dashes)`);
