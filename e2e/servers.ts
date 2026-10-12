/**
 * Extra app servers playwright.config.ts starts from the same build, differing
 * only in the runtime Turnstile secret:
 * - GATE_CLOSED: Cloudflare's always-fail dummy secret, so every token is
 *   refused by Cloudflare's real siteverify.
 * - SECRET_MISSING: no secret at all (the site key is still baked into the
 *   page), the misconfiguration that used to block visitors silently.
 */
export const GATE_CLOSED_PORT = 3101;
export const SECRET_MISSING_PORT = 3102;
export const GATE_CLOSED_URL = `http://localhost:${GATE_CLOSED_PORT}`;
export const SECRET_MISSING_URL = `http://localhost:${SECRET_MISSING_PORT}`;
