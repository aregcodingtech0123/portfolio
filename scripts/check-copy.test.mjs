import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateFiles, scanContent } from "./check-copy.mjs";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "check-copy",
);

describe("scanContent (pure)", () => {
  it("reports nothing for clean content", () => {
    expect(scanContent("plain copy\nmore copy\n", "x.txt")).toEqual({
      emDash: [],
      todo: [],
    });
  });

  it("flags an em dash with the 1-indexed line number", () => {
    const result = scanContent("fine—not fine\n", "x.txt");
    expect(result.emDash).toEqual(["x.txt:1: fine—not fine"]);
    expect(result.todo).toEqual([]);
  });

  it("flags both TODO: and [TODO forms", () => {
    const result = scanContent("TODO: do this\n[TODO later]\n", "x.txt");
    expect(result.todo).toHaveLength(2);
  });
});

describe("evaluateFiles against the check-copy fixtures", () => {
  it("passes the clean fixture", () => {
    const result = evaluateFiles([join(FIXTURES, "clean.txt")], FIXTURES);
    expect(result.failed).toBe(false);
    expect(result.emDashFailures).toEqual([]);
    expect(result.todoFailures).toEqual([]);
  });

  it("fails the em-dash fixture and reports the file and line", () => {
    const result = evaluateFiles([join(FIXTURES, "em-dash.txt")], FIXTURES);
    expect(result.failed).toBe(true);
    expect(result.emDashFailures).toHaveLength(1);
    expect(result.emDashFailures[0]).toContain("em-dash.txt:2");
    expect(result.todoFailures).toEqual([]);
  });

  it("fails the TODO fixture and reports the file and line", () => {
    const result = evaluateFiles([join(FIXTURES, "todo.txt")], FIXTURES);
    expect(result.failed).toBe(true);
    expect(result.todoFailures).toHaveLength(1);
    expect(result.todoFailures[0]).toContain("todo.txt:2");
    expect(result.emDashFailures).toEqual([]);
  });

  it("scoping a multi-file evaluation keeps each failure attributed to its own file", () => {
    const all = ["clean.txt", "em-dash.txt", "todo.txt"].map((f) =>
      join(FIXTURES, f),
    );
    const result = evaluateFiles(all, FIXTURES);
    expect(result.failed).toBe(true);
    expect(result.emDashFailures.every((f) => f.startsWith("em-dash.txt"))).toBe(
      true,
    );
    expect(result.todoFailures.every((f) => f.startsWith("todo.txt"))).toBe(
      true,
    );
  });
});
