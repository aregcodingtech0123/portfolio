/**
 * Runs once when a server instance starts. Logs configuration problems loudly
 * and never throws: a misconfigured contact form must not take the whole
 * portfolio down. The build already fails on the same rules (next.config.ts),
 * so this is the backstop for a host whose runtime environment differs from
 * its build environment.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { formatIssues, validateEnv } = await import("@/lib/env-validation");
  const { runtimeEnvSnapshot } = await import("@/lib/env-snapshot");

  const issues = validateEnv(runtimeEnvSnapshot(), {
    production: process.env.NODE_ENV === "production",
  });
  if (issues.length === 0) return;

  const errors = issues.filter((i) => i.severity === "error");
  const banner = `[env] ${errors.length} configuration error(s), ${issues.length - errors.length} warning(s):\n${formatIssues(issues)}`;
  if (errors.length > 0) console.error(banner);
  else console.warn(banner);
}
