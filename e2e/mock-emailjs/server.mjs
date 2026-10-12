/**
 * A stand-in for EmailJS's REST API for the Playwright run. The app sends the
 * contact email from the server, so browser-level routing cannot intercept it;
 * instead the app is started with EMAILJS_API_ORIGIN pointing here (honoured
 * only under APP_ENV=test, see src/lib/contact/email-transport.ts). No real
 * email is ever sent by an automated run.
 *
 * It behaves like the real endpoint where it matters:
 * - POST /api/v1.0/email/send requires service_id, template_id and user_id,
 *   and refuses a request without the expected private key (accessToken), the
 *   way EmailJS does with "Use Private Key" enabled.
 * - A marker in template_params.subject picks a failure, so parallel tests do
 *   not share state:
 *     [mock:fail-500]      -> 500, a provider outage (transient)
 *     [mock:misconfigured] -> 403 "API calls are disabled for non-browser
 *                             applications" (a dashboard setting not done)
 *
 * Test helpers:
 * - GET /__sent?subject=<substring>  -> the accepted sends whose subject
 *   contains the substring (JSON array).
 * - GET /health                      -> 200 (Playwright's readiness probe).
 *
 * Usage: node e2e/mock-emailjs/server.mjs   (port: MOCK_EMAILJS_PORT or 3199)
 */
import { createServer } from "node:http";

export const MOCK_EMAILJS_PORT = Number(process.env.MOCK_EMAILJS_PORT ?? 3199);
// Keep in step with MOCK_EMAILJS_PRIVATE_KEY in ./constants.ts.
export const MOCK_PRIVATE_KEY = "e2e-private-key";

const sent = [];

function reply(res, status, body, type = "text/plain") {
  res.writeHead(status, { "Content-Type": type });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/health") return reply(res, 200, "ok");

  if (req.method === "GET" && url.pathname === "/__sent") {
    const needle = url.searchParams.get("subject") ?? "";
    return reply(res, 200, sent.filter((s) => s.template_params.subject.includes(needle)), "application/json");
  }

  if (req.method === "POST" && url.pathname === "/api/v1.0/email/send") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) req.destroy();
    });
    req.on("end", () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return reply(res, 400, "Bad request");
      }
      if (!body.user_id) return reply(res, 400, "The user_id parameter is required");
      if (!body.service_id || !body.template_id) return reply(res, 400, "The service ID and template ID are required");
      if (body.accessToken !== MOCK_PRIVATE_KEY) return reply(res, 403, "The Private Key is invalid or missing");

      const subject = String(body.template_params?.subject ?? "");
      if (subject.includes("[mock:fail-500]")) return reply(res, 500, "Internal server error");
      if (subject.includes("[mock:misconfigured]")) {
        return reply(res, 403, "API calls are disabled for non-browser applications");
      }

      sent.push({ template_params: body.template_params ?? {}, receivedAt: Date.now() });
      return reply(res, 200, "OK");
    });
    return;
  }

  reply(res, 404, "Not found");
});

server.listen(MOCK_EMAILJS_PORT, "127.0.0.1", () => {
  console.log(`[mock-emailjs] listening on http://127.0.0.1:${MOCK_EMAILJS_PORT}`);
});
