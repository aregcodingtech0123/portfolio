/**
 * Turns `npm audit --json` into a short report for the CI run page.
 *
 *   npm audit --json > audit.json
 *   node scripts/audit-summary.mjs audit.json
 *
 * Report only: it always exits 0. The count by itself is misleading here (most
 * findings are Sanity CLI, ESLint and test tooling that never run on the host
 * or reach a visitor), so it points at docs/security/dependency-audit.md for
 * how to tell a finding that matters from one that does not.
 */
import { appendFileSync, readFileSync } from "node:fs";

const file = process.argv[2] ?? "audit.json";

let audit;
try {
  audit = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
  // An unreadable report (registry unreachable, for example) is not a build failure.
  console.log(`npm audit report unavailable: ${error instanceof Error ? error.message : error}`);
  process.exit(0);
}

const counts = audit.metadata?.vulnerabilities ?? {};
const serious = Object.values(audit.vulnerabilities ?? {})
  .filter((v) => v.severity === "critical" || v.severity === "high")
  .sort((a, b) => a.severity.localeCompare(b.severity) || a.name.localeCompare(b.name));

const lines = [
  "## npm audit (report only, never fails the build)",
  "",
  `critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0}`,
  "",
  "| package | severity | how it is installed |",
  "|---|---|---|",
  ...serious.map((v) => `| ${v.name} | ${v.severity} | ${v.isDirect ? "direct dependency" : "transitive"} |`),
  "",
  "Before acting on a line, check whether it is in the browser bundle or a route's server trace: docs/security/dependency-audit.md",
  "",
];

const text = lines.join("\n");
console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
