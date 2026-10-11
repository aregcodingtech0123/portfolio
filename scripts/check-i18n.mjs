// Cross-checks messages/en.json and messages/tr.json against next-intl usage in src/.
//
// Fails the build on:
//   - a key referenced in code (via useTranslations/getTranslations + t(...)) that is
//     missing from either catalog
//   - key parity drift between en.json and tr.json
//
// Warns, without failing, on:
//   - a catalog key with no detected call site (some copy is consumed as a raw array
//     or object rather than through a resolvable t("key") call, so this is a prompt to
//     check by hand, not proof of dead copy)
//   - a key lookup this script could not resolve statically, e.g. t(someVariable) or
//     a template literal with interpolation. These are real code paths; reporting them
//     as a warning instead of guessing (and risking a false "missing key" failure) is
//     the whole point of this script being honest about its own limits.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { i18nDynamicAllowlist } from "./i18n-dynamic-allowlist.mjs";

// cwd, not a URL derived from import.meta.url: see the same comment in
// check-copy.mjs. Both real invocations run from the repo root.
const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");
const MESSAGES = {
  en: join(ROOT, "messages", "en.json"),
  tr: join(ROOT, "messages", "tr.json"),
};

const KEY_METHODS = new Set(["rich", "has", "markup", "raw"]);
const DYNAMIC_NAMESPACE = Symbol("dynamic-namespace");

export function walkSourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, out);
    } else if (
      (extname(full) === ".ts" || extname(full) === ".tsx") &&
      !full.endsWith(".d.ts")
    ) {
      out.push(full);
    }
  }
  return out;
}

/** Pure: flattens a catalog object into dotted keys. Arrays are leaves, not containers. */
export function flattenCatalog(obj, prefix = "") {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const nested of flattenCatalog(v, full)) keys.add(nested);
    } else {
      keys.add(full);
    }
  }
  return keys;
}

export function loadCatalog(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function namespaceFromHookCall(call) {
  if (!ts.isIdentifier(call.expression)) return undefined;
  const name = call.expression.text;

  if (name === "useTranslations") {
    if (call.arguments.length === 0) return "";
    return ts.isStringLiteralLike(call.arguments[0])
      ? call.arguments[0].text
      : DYNAMIC_NAMESPACE;
  }

  if (name === "getTranslations") {
    if (call.arguments.length === 0) return "";
    const arg = call.arguments[0];
    if (ts.isStringLiteralLike(arg)) return arg.text;
    if (ts.isObjectLiteralExpression(arg)) {
      const prop = arg.properties.find(
        (p) =>
          ts.isPropertyAssignment(p) &&
          ts.isIdentifier(p.name) &&
          p.name.text === "namespace",
      );
      if (!prop) return "";
      return ts.isStringLiteralLike(prop.initializer)
        ? prop.initializer.text
        : DYNAMIC_NAMESPACE;
    }
    return DYNAMIC_NAMESPACE;
  }

  return undefined;
}

/** Unwraps `expr as const`, `expr satisfies T`, or both, down to the real expression. */
function unwrapAssertions(node) {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    node = node.expression;
  }
  return node;
}

/**
 * If `node` is an object literal whose every property is a plain
 * `key: "stringLiteral"` assignment (no shorthand, computed keys, spreads,
 * or non-string values), returns its values. Otherwise null: a partial or
 * guessed resolution would be worse than reporting the call as unresolved.
 */
function literalStringMapValues(node) {
  const obj = unwrapAssertions(node);
  if (!ts.isObjectLiteralExpression(obj)) return null;
  const values = [];
  for (const prop of obj.properties) {
    if (
      !ts.isPropertyAssignment(prop) ||
      (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) ||
      !ts.isStringLiteralLike(prop.initializer)
    ) {
      return null;
    }
    values.push(prop.initializer.text);
  }
  return values;
}

/**
 * Parses one source file and returns the i18n keys it statically resolves,
 * plus any key lookup it could not resolve.
 *
 * Bindings (`t`/`s`/`n` -> namespace, and lookup-object name -> its string
 * values) are tracked in one flat, file-scoped map rather than real lexical
 * scope. That's a deliberate simplification: this codebase never shadows a
 * translation variable or a lookup object across nested scopes, and a flat
 * map walked in source order resolves correctly as long as that holds. It
 * would under- or over-resolve in a file that did shadow one.
 */
export function extractUsage(filePath, content) {
  const scriptKind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const relPath = relative(ROOT, filePath);
  const bindings = new Map();
  const lookupObjects = new Map();
  const usedKeys = [];
  const dynamicUsages = [];

  const lineOf = (node) =>
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  /**
   * Resolves the common "lookup table" dynamic-key shape: `OBJECT[x]`, or
   * that same access as the sole interpolation in a template literal (e.g.
   * `` `tiers.${TIER_KEY[tier]}` ``), where OBJECT is a same-file `const`
   * object literal with all string-literal values (an enum-to-key-suffix
   * map, typically written `as const satisfies Record<...>`). Returns the
   * full set of possible literal suffixes -- every value OBJECT could
   * produce, since which one a given call takes isn't known statically, and
   * over-approximating "used" keys here is harmless for an unused-key
   * warning. Returns null if the shape doesn't match.
   */
  function resolveLookupObjectAccess(node) {
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const values = lookupObjects.get(node.expression.text);
      return values ? values.map((v) => ({ prefix: "", value: v, suffix: "" })) : null;
    }
    if (ts.isTemplateExpression(node) && node.templateSpans.length === 1) {
      const span = node.templateSpans[0];
      if (ts.isElementAccessExpression(span.expression) && ts.isIdentifier(span.expression.expression)) {
        const values = lookupObjects.get(span.expression.expression.text);
        if (!values) return null;
        return values.map((v) => ({
          prefix: node.head.text,
          value: v,
          suffix: span.literal.text,
        }));
      }
    }
    return null;
  }

  function recordKeyUsage(namespace, keyArgNode) {
    if (namespace === DYNAMIC_NAMESPACE) {
      dynamicUsages.push({
        file: relPath,
        line: lineOf(keyArgNode),
        reason: "dynamic namespace",
        snippet: keyArgNode.getText(sourceFile).slice(0, 80),
      });
      return;
    }
    if (ts.isStringLiteralLike(keyArgNode)) {
      const literal = keyArgNode.text;
      usedKeys.push({
        key: namespace ? `${namespace}.${literal}` : literal,
        file: relPath,
        line: lineOf(keyArgNode),
      });
      return;
    }
    const lookupMatches = resolveLookupObjectAccess(keyArgNode);
    if (lookupMatches) {
      for (const { prefix, value, suffix } of lookupMatches) {
        const literal = `${prefix}${value}${suffix}`;
        usedKeys.push({
          key: namespace ? `${namespace}.${literal}` : literal,
          file: relPath,
          line: lineOf(keyArgNode),
        });
      }
      return;
    }
    dynamicUsages.push({
      file: relPath,
      line: lineOf(keyArgNode),
      reason: "computed key",
      snippet: keyArgNode.getText(sourceFile).slice(0, 80),
    });
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
      const init = ts.isAwaitExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (ts.isCallExpression(init)) {
        const ns = namespaceFromHookCall(init);
        if (ns !== undefined) bindings.set(node.name.text, ns);
      } else {
        const values = literalStringMapValues(node.initializer);
        if (values) lookupObjects.set(node.name.text, values);
      }
    }

    if (ts.isCallExpression(node)) {
      let boundName = null;
      if (ts.isIdentifier(node.expression) && bindings.has(node.expression.text)) {
        boundName = node.expression.text;
      } else if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        ts.isIdentifier(node.expression.name) &&
        KEY_METHODS.has(node.expression.name.text) &&
        bindings.has(node.expression.expression.text)
      ) {
        boundName = node.expression.expression.text;
      }
      if (boundName && node.arguments.length > 0) {
        recordKeyUsage(bindings.get(boundName), node.arguments[0]);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { usedKeys, dynamicUsages };
}

export function collectUsage(files) {
  const usedKeys = [];
  const dynamicUsages = [];
  for (const file of files) {
    const result = extractUsage(file, readFileSync(file, "utf8"));
    usedKeys.push(...result.usedKeys);
    dynamicUsages.push(...result.dynamicUsages);
  }
  return { usedKeys, dynamicUsages };
}

/**
 * Pure: given extracted usage and both parsed catalogs, returns missing-key,
 * parity-drift, unused-key and dynamic-usage findings. No file I/O.
 *
 * `allowlist` entries count as "used" for the unused-key warning only. They
 * are never checked against missing/parity-drift: an allowlist entry for a
 * key that doesn't exist in the catalog is a stale allowlist, not a build
 * failure, and this script already can't verify an allowlisted key is
 * actually still reached in code (that's exactly why it's allowlisted).
 */
export function evaluate({
  usedKeys,
  dynamicUsages,
  enCatalog,
  trCatalog,
  allowlist = i18nDynamicAllowlist,
}) {
  const enKeys = flattenCatalog(enCatalog);
  const trKeys = flattenCatalog(trCatalog);

  const missing = [];
  const seenKeys = new Set(allowlist.map((entry) => entry.key));
  for (const usage of usedKeys) {
    seenKeys.add(usage.key);
    const missingFrom = [];
    if (!enKeys.has(usage.key)) missingFrom.push("en");
    if (!trKeys.has(usage.key)) missingFrom.push("tr");
    if (missingFrom.length) missing.push({ ...usage, missingFrom });
  }

  const parityDrift = {
    onlyInEn: [...enKeys].filter((k) => !trKeys.has(k)).sort(),
    onlyInTr: [...trKeys].filter((k) => !enKeys.has(k)).sort(),
  };

  const allCatalogKeys = new Set([...enKeys, ...trKeys]);
  const unused = [...allCatalogKeys].filter((k) => !seenKeys.has(k)).sort();

  const failed =
    missing.length > 0 ||
    parityDrift.onlyInEn.length > 0 ||
    parityDrift.onlyInTr.length > 0;

  return { missing, parityDrift, unused, dynamicUsages, failed };
}

function printReport(result) {
  if (result.missing.length) {
    console.error(`Keys used in code but missing from a catalog (${result.missing.length}):`);
    result.missing.forEach((m) =>
      console.error(`  ${m.file}:${m.line}: "${m.key}" missing from ${m.missingFrom.join(", ")}`),
    );
  }
  if (result.parityDrift.onlyInEn.length) {
    console.error(`Keys in en.json but not tr.json (${result.parityDrift.onlyInEn.length}):`);
    result.parityDrift.onlyInEn.forEach((k) => console.error(`  ${k}`));
  }
  if (result.parityDrift.onlyInTr.length) {
    console.error(`Keys in tr.json but not en.json (${result.parityDrift.onlyInTr.length}):`);
    result.parityDrift.onlyInTr.forEach((k) => console.error(`  ${k}`));
  }
  if (result.unused.length) {
    console.warn(
      `Catalog keys with no detected call site (${result.unused.length}). Not failing the build on these, review by hand:`,
    );
    result.unused.forEach((k) => console.warn(`  ${k}`));
  }
  if (result.dynamicUsages.length) {
    console.warn(
      `Key lookups this script could not resolve statically (${result.dynamicUsages.length}). These are real code, not catalog drift; review by hand:`,
    );
    result.dynamicUsages.forEach((d) =>
      console.warn(`  ${d.file}:${d.line}: ${d.reason} -> ${d.snippet}`),
    );
  }
  if (result.failed) return;
  console.log(
    `check:i18n passed (0 missing keys, 0 parity drift, ${result.unused.length} unused keys and ${result.dynamicUsages.length} unresolved dynamic keys reported above)`,
  );
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const files = walkSourceFiles(SRC_DIR);
  const { usedKeys, dynamicUsages } = collectUsage(files);
  const enCatalog = loadCatalog(MESSAGES.en);
  const trCatalog = loadCatalog(MESSAGES.tr);
  const result = evaluate({ usedKeys, dynamicUsages, enCatalog, trCatalog });
  printReport(result);
  if (result.failed) process.exit(1);
}
