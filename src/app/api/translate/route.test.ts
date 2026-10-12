import { afterEach, describe, expect, it, vi } from "vitest";
import { TranslateError } from "@/lib/translate/server";

// vi.mock's factory is hoisted above regular const declarations, so the
// mock fn it closes over must be created through vi.hoisted instead.
const { translateTextMock } = vi.hoisted(() => ({ translateTextMock: vi.fn() }));

vi.mock("@/lib/translate/server", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/translate/server")>(
      "@/lib/translate/server",
    );
  return { ...actual, translateText: translateTextMock };
});

const { POST } = await import("./route");

function postRequest(
  body: unknown,
  headers: Record<string, string> = { "Content-Type": "application/json" },
) {
  return new Request("http://localhost/api/translate", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  translateTextMock.mockReset();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/translate: access (disabled in production unless opted in)", () => {
  it("answers 404 in production by default and never reaches the translator", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRANSLATE_ENABLED", "");
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it("does not reveal why it is off (no variable names in the body)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRANSLATE_ENABLED", "");
    const res = await POST(postRequest({ text: "Hello" }));
    const body = JSON.stringify(await res.json());
    expect(body).not.toMatch(/TRANSLATE_ENABLED|GEMINI|env/i);
  });

  it("works in production when TRANSLATE_ENABLED=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRANSLATE_ENABLED", "true");
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(200);
  });

  it("is on by default outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TRANSLATE_ENABLED", "");
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(200);
  });

  it("can be switched off outside production too", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TRANSLATE_ENABLED", "false");
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(404);
  });

  it("sends Cache-Control: no-store", async () => {
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("POST /api/translate: cross-site and content-type", () => {
  const json = { "Content-Type": "application/json" };

  it.each(["cross-site", "same-site"])("refuses Sec-Fetch-Site: %s with 403", async (site) => {
    const res = await POST(postRequest({ text: "Hello" }, { ...json, "Sec-Fetch-Site": site }));
    expect(res.status).toBe(403);
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it.each(["same-origin", "none"])("allows Sec-Fetch-Site: %s", async (site) => {
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }, { ...json, "Sec-Fetch-Site": site }));
    expect(res.status).toBe(200);
  });

  it("allows a request with no Sec-Fetch-Site header (curl, older browsers)", async () => {
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }, json));
    expect(res.status).toBe(200);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"])(
    "rejects Content-Type %s with 415 (a plain cross-site form cannot reach it)",
    async (type) => {
      const res = await POST(postRequest('{"text":"Hello"}', { "Content-Type": type }));
      expect(res.status).toBe(415);
      expect(translateTextMock).not.toHaveBeenCalled();
    },
  );

  it("rejects a request with no Content-Type", async () => {
    const res = await POST(new Request("http://localhost/api/translate", { method: "POST", body: '{"text":"Hello"}', headers: {} }));
    // fetch gives a string body a text/plain default, which is itself rejected.
    expect(res.status).toBe(415);
  });

  it("accepts a charset parameter", async () => {
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }, { "Content-Type": "application/json; charset=utf-8" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/translate: body size", () => {
  it("refuses a body over the cap by Content-Length without reading it", async () => {
    const res = await POST(
      postRequest({ text: "a" }, { "Content-Type": "application/json", "Content-Length": String(40 * 1024) }),
    );
    expect(res.status).toBe(413);
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it("refuses a real oversized body (12 MB) with 413", async () => {
    const res = await POST(postRequest({ text: "a".repeat(12_000_000) }));
    expect(res.status).toBe(413);
    expect(translateTextMock).not.toHaveBeenCalled();
  });

  it("accepts a maximal legitimate body (5,000 characters, every one JSON-escaped)", async () => {
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    // é style escapes are the worst case: 6 bytes per character.
    const worstCase = '{"text":"' + "\\u00e9".repeat(5000) + '"}';
    expect(worstCase.length).toBeLessThan(32 * 1024);
    const res = await POST(postRequest(worstCase));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/translate: request validation", () => {
  it("rejects a body that is not valid JSON", async () => {
    const res = await POST(postRequest("{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });

  it.each(["null", "42", '"text"'])("rejects the JSON value %s", async (value) => {
    const res = await POST(postRequest(value));
    expect(res.status).toBe(400);
  });

  it("rejects a non-string text field", async () => {
    const res = await POST(postRequest({ text: 42 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "text must be a string" });
  });

  it("rejects whitespace-only text", async () => {
    const res = await POST(postRequest({ text: "   " }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "text is required" });
  });
});

describe("POST /api/translate: success", () => {
  it("returns the translated text with a 200", async () => {
    translateTextMock.mockResolvedValue({ translatedText: "Merhaba" });
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ translatedText: "Merhaba" });
  });
});

describe("POST /api/translate: errors are generic, detail stays in the log", () => {
  it("returns the public message and status of a TranslateError, never its detail", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    translateTextMock.mockRejectedValue(
      new TranslateError("GEMINI_API_KEY is not configured on the server", 503, "Translation is unavailable"),
    );
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: "Translation is unavailable" });
    expect(JSON.stringify(body)).not.toContain("GEMINI_API_KEY");
    expect(log.mock.calls.flat().join(" ")).toContain("GEMINI_API_KEY");
  });

  it("does not return the upstream's raw message on an unexpected error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    translateTextMock.mockRejectedValue(new Error("upstream said: project 123456789 is over quota in region x"));
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Translation failed" });
    expect(log.mock.calls.flat().join(" ")).toContain("project 123456789");
  });

  it("keeps validation errors from the translator specific and safe", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    translateTextMock.mockRejectedValue(new TranslateError("text exceeds 5000 characters", 400));
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "text exceeds 5000 characters" });
  });
});
