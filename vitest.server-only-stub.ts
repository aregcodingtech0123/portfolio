/**
 * Stand-in for the `server-only` package under Vitest (vitest.config.ts aliases
 * it here). In a Next.js build `server-only` throws if a Client Component
 * graph ever imports the module that carries it, which is the point. The unit
 * tests run in plain Node and import those modules on purpose, so the guard
 * must be a no-op there. The guard itself is covered by
 * src/lib/secret-boundary.test.ts, which asserts the import is present.
 */
export {};
