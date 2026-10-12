import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

import { MAX_CHARS, MAX_OUTPUT_TOKENS, TranslateError, translateText } from "@/lib/translate/server";

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "AIzaSyRealLookingKey1234567890");
  vi.stubEnv("GEMINI_MODEL", "");
});

afterEach(() => {
  generateContentMock.mockReset();
  vi.unstubAllEnvs();
});

async function rejection(promise: Promise<unknown>): Promise<TranslateError> {
  try {
    await promise;
  } catch (e) {
    return e as TranslateError;
  }
  throw new Error("expected a rejection");
}

describe("translateText: the call it makes", () => {
  it("caps the output and bounds the upstream call", async () => {
    generateContentMock.mockResolvedValue({ text: " Merhaba ", candidates: [{ finishReason: "STOP" }] });
    const result = await translateText({ text: "Hello" });
    expect(result).toEqual({ translatedText: "Merhaba" });

    const config = generateContentMock.mock.calls[0][0].config;
    expect(config.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
    expect(config.abortSignal).toBeInstanceOf(AbortSignal);
    expect(config.temperature).toBe(0.2);
  });

  it("refuses text over the character limit before calling the API", async () => {
    const error = await rejection(translateText({ text: "a".repeat(MAX_CHARS + 1) }));
    expect(error.status).toBe(400);
    expect(generateContentMock).not.toHaveBeenCalled();
  });
});

describe("translateText: failures give a public message and keep the detail", () => {
  it("a missing key is 503 with a generic public message that names no variable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const error = await rejection(translateText({ text: "Hello" }));
    expect(error.status).toBe(503);
    expect(error.message).toContain("GEMINI_API_KEY");
    expect(error.publicMessage).toBe("Translation is unavailable");
    expect(error.publicMessage).not.toContain("GEMINI");
  });

  it("an upstream authentication failure is 503 and does not echo the upstream's wording", async () => {
    generateContentMock.mockRejectedValue(new Error("API key not valid. Please pass a valid API key."));
    const error = await rejection(translateText({ text: "Hello" }));
    expect(error.status).toBe(503);
    expect(error.publicMessage).toBe("Translation is unavailable");
    expect(error.message).toContain("API key not valid");
  });

  it("an upstream quota error is 429 with a generic retry message", async () => {
    generateContentMock.mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED: quota for project 1234 exceeded"));
    const error = await rejection(translateText({ text: "Hello" }));
    expect(error.status).toBe(429);
    expect(error.publicMessage).toBe("Translation is busy. Please try again shortly.");
    expect(error.publicMessage).not.toContain("1234");
  });

  it("any other upstream failure is 502 'Translation failed' with the raw message only in detail", async () => {
    generateContentMock.mockRejectedValue(new Error("internal backend 10.0.0.7 exploded"));
    const error = await rejection(translateText({ text: "Hello" }));
    expect(error.status).toBe(502);
    expect(error.publicMessage).toBe("Translation failed");
    expect(error.message).toContain("10.0.0.7");
  });

  it("a translation cut off at the output cap is an error, not a partial result", async () => {
    generateContentMock.mockResolvedValue({ text: "Yarım", candidates: [{ finishReason: "MAX_TOKENS" }] });
    const error = await rejection(translateText({ text: "Hello" }));
    expect(error.status).toBe(502);
    expect(error.publicMessage).toBe("Translation failed");
  });

  it("an empty translation is an error", async () => {
    generateContentMock.mockResolvedValue({ text: "  ", candidates: [{ finishReason: "STOP" }] });
    const error = await rejection(translateText({ text: "Hello" }));
    expect(error.status).toBe(502);
  });
});
