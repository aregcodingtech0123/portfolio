import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * The server-only secrets must never be one refactor away from the browser.
 * A canary build proved today's output is clean; these tests keep it that way
 * by pinning the boundary in source:
 *   - who may READ each secret (process.env.NAME), by an explicit allowlist;
 *   - that no Client Component imports a server-only module or reads one;
 *   - that the server-only modules carry the `server-only` guard, which makes
 *     a Next build fail if a Client Component graph ever reaches them;
 *   - that no NEXT_PUBLIC_ variable is named like a secret, and next.config's
 *     `env` block (which inlines into the client bundle) holds no secret.
 */

const ROOT = process.cwd();

const SECRET_READERS: Record<string, string[]> = {
  TURNSTILE_SECRET_KEY: ["src/lib/turnstile-server.ts", "src/lib/env-snapshot.ts"],
  GEMINI_API_KEY: ["src/lib/translate/server.ts", "src/lib/env-snapshot.ts"],
  // Nothing the site runs needs the write token. Only the developer-machine
  // seed script reads it (and env-snapshot, to refuse it in production).
  SANITY_API_WRITE_TOKEN: ["scripts/seed-sanity.ts", "src/lib/env-snapshot.ts"],
  // The credential that sends mail. It must never be readable by the browser.
  EMAILJS_PRIVATE_KEY: ["src/lib/contact/email-transport.ts", "src/lib/env-snapshot.ts"],
};

const SERVER_ONLY_MODULES = [
  "src/lib/turnstile-server.ts",
  "src/lib/translate/server.ts",
  "src/lib/contact/email-transport.ts",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(rel, out);
    } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const isTest = (f: string) => /\.test\.(ts|tsx|mjs)$/.test(f) || f.includes("__fixtures__");
const sourceFiles = [...walk("src"), ...walk("sanity"), ...walk("scripts")].filter((f) => !isTest(f));
const clientFiles = sourceFiles.filter((f) => /^\s*(\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*["']use client["']/.test(read(f)));

function readsSecret(code: string, name: string) {
  return new RegExp(`process\\.env\\.${name}\\b|process\\.env\\[\\s*["']${name}["']\\s*\\]`).test(code);
}

describe("who may read each server-only secret", () => {
  for (const [name, allowed] of Object.entries(SECRET_READERS)) {
    it(`${name} is read only by ${allowed.join(" and ")}`, () => {
      const readers = sourceFiles.filter((f) => readsSecret(read(f), name)).sort();
      expect(readers).toEqual([...allowed].sort());
    });
  }
});

describe("Client Components", () => {
  it("are found (the scan is not silently empty)", () => {
    expect(clientFiles.length).toBeGreaterThan(10);
    expect(clientFiles).toContain("src/components/sections/Contact.tsx");
    expect(clientFiles).toContain("sanity/components/LocaleTranslateInput.tsx");
  });

  it("never import a server-only module, the env snapshot or instrumentation", () => {
    const forbidden =
      /from\s+["'](@\/lib\/turnstile-server|@\/lib\/translate\/server|@\/lib\/contact\/email-transport|@\/lib\/env-snapshot|@\/instrumentation|\.{1,2}\/[^"']*(turnstile-server|translate\/server|email-transport|env-snapshot))["']/;
    const offenders = clientFiles.filter((f) => forbidden.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("never read a server-only secret", () => {
    const offenders = clientFiles.filter((f) =>
      Object.keys(SECRET_READERS).some((name) => readsSecret(read(f), name)),
    );
    expect(offenders).toEqual([]);
  });
});

describe("the server-only guard", () => {
  it.each(SERVER_ONLY_MODULES)('%s imports "server-only"', (file) => {
    expect(read(file)).toMatch(/^\s*import\s+["']server-only["'];?\s*$/m);
  });
});

describe("the NEXT_PUBLIC_ boundary", () => {
  it("no NEXT_PUBLIC_ variable is named like a secret", () => {
    const text = [...sourceFiles.map(read), read(".env.example"), read("README.md")].join("\n");
    const names = [...new Set(text.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? [])];
    expect(names.length).toBeGreaterThan(5);
    expect(names.filter((n) => /SECRET|TOKEN|PRIVATE|WRITE|PASSWORD/.test(n))).toEqual([]);
  });

  it("next.config.ts `env` (inlined into client bundles) holds no secret", () => {
    const config = read("next.config.ts");
    const start = config.indexOf("env: {");
    const end = config.indexOf("experimental:", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(config.slice(start, end)).not.toMatch(/SECRET|TOKEN|GEMINI|PRIVATE|process\.env\.[A-Z_]*KEY/);
  });
});
