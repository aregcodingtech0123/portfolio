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

function postRequest(body: unknown) {
  return new Request("http://localhost/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  translateTextMock.mockReset();
});

describe("POST /api/translate: request validation", () => {
  it("rejects a body that is not valid JSON", async () => {
    const res = await POST(postRequest("{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
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

describe("POST /api/translate: error-status mapping", () => {
  it("uses TranslateError.status directly", async () => {
    translateTextMock.mockRejectedValue(
      new TranslateError("GEMINI_API_KEY is not configured on the server", 503),
    );
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "GEMINI_API_KEY is not configured on the server",
    });
  });

  it("maps a plain Error whose message mentions rate limiting to 429", async () => {
    translateTextMock.mockRejectedValue(new Error("Quota exceeded, slow down"));
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(429);
  });

  it("maps a plain Error whose message does not match any known pattern to 502", async () => {
    translateTextMock.mockRejectedValue(new Error("boom"));
    const res = await POST(postRequest({ text: "Hello" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});
