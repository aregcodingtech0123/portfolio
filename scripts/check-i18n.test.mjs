import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluate,
  extractUsage,
  flattenCatalog,
  loadCatalog,
  walkSourceFiles,
} from "./check-i18n.mjs";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "check-i18n",
);

describe("flattenCatalog (pure)", () => {
  it("flattens nested objects but treats arrays as leaves", () => {
    const keys = flattenCatalog({ a: { b: "x", c: ["y", "z"] }, d: "w" });
    expect([...keys].sort()).toEqual(["a.b", "a.c", "d"]);
  });
});

describe("walkSourceFiles", () => {
  it("finds .ts/.tsx fixture files", () => {
    const files = walkSourceFiles(join(FIXTURES, "src"));
    expect(files.some((f) => f.endsWith("sample.ts"))).toBe(true);
    expect(files.some((f) => f.endsWith("sample-server.ts"))).toBe(true);
  });
});

describe("extractUsage: useTranslations", () => {
  const filePath = join(FIXTURES, "src", "sample.ts");
  const { usedKeys, dynamicUsages } = extractUsage(
    filePath,
    readFileSync(filePath, "utf8"),
  );

  it("resolves string-literal t(\"key\") calls against the bound namespace", () => {
    const keys = usedKeys.map((u) => u.key);
    expect(keys).toContain("Greeting.hello");
    expect(keys).toContain("Greeting.bye");
    expect(keys).toContain("Greeting.missingKey");
  });

  it("reports an identifier-based key lookup as unresolvable instead of guessing", () => {
    expect(dynamicUsages).toHaveLength(1);
    expect(dynamicUsages[0].reason).toBe("computed key");
    expect(dynamicUsages[0].snippet).toBe("dynamicKey");
  });
});

describe("extractUsage: getTranslations (server)", () => {
  const filePath = join(FIXTURES, "src", "sample-server.ts");
  const { usedKeys, dynamicUsages } = extractUsage(
    filePath,
    readFileSync(filePath, "utf8"),
  );

  it("resolves the namespace from the { namespace: \"...\" } option object", () => {
    expect(usedKeys.map((u) => u.key)).toEqual(["Greeting.hello"]);
    expect(dynamicUsages).toEqual([]);
  });
});

describe("evaluate against the fixture catalogs", () => {
  const filePath = join(FIXTURES, "src", "sample.ts");
  const { usedKeys, dynamicUsages } = extractUsage(
    filePath,
    readFileSync(filePath, "utf8"),
  );
  const enCatalog = loadCatalog(join(FIXTURES, "catalogs", "en.json"));
  const trCatalog = loadCatalog(join(FIXTURES, "catalogs", "tr.json"));
  const result = evaluate({ usedKeys, dynamicUsages, enCatalog, trCatalog });

  it("fails on a key used in code but missing from one catalog", () => {
    const finding = result.missing.find((m) => m.key === "Greeting.bye");
    expect(finding).toBeTruthy();
    expect(finding.missingFrom).toEqual(["tr"]);
  });

  it("fails on a key used in code but missing from both catalogs", () => {
    const finding = result.missing.find((m) => m.key === "Greeting.missingKey");
    expect(finding.missingFrom).toEqual(["en", "tr"]);
  });

  it("reports parity drift for a key present in en but not tr", () => {
    expect(result.parityDrift.onlyInEn).toContain("Greeting.bye");
    expect(result.parityDrift.onlyInTr).toEqual([]);
  });

  it("warns, but does not fail, on a catalog key with no call site", () => {
    expect(result.unused).toContain("Unused.orphan");
  });

  it("carries the unresolved dynamic usage through without treating it as a failure", () => {
    expect(result.dynamicUsages).toHaveLength(1);
  });

  it("marks the overall result as failed because of the missing/parity findings", () => {
    expect(result.failed).toBe(true);
  });
});

describe("evaluate on a catalog pair with full parity and coverage", () => {
  it("does not fail when every used key exists in both catalogs", () => {
    const enCatalog = { Greeting: { hello: "Hello" } };
    const trCatalog = { Greeting: { hello: "Merhaba" } };
    const usedKeys = [{ key: "Greeting.hello", file: "x.ts", line: 1 }];
    const result = evaluate({
      usedKeys,
      dynamicUsages: [],
      enCatalog,
      trCatalog,
    });
    expect(result.failed).toBe(false);
    expect(result.missing).toEqual([]);
    expect(result.unused).toEqual([]);
  });
});
