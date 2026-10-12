import { GoogleGenAI } from "@google/genai";

export type TranslateInput = {
  text: string;
};

export type TranslateResult = {
  translatedText: string;
};

export const TRANSLATOR_SYSTEM_INSTRUCTION =
  "You are an expert technical translator specializing in software engineering, AI, and cybersecurity. Translate the provided English text into natural, professional Turkish. CRITICAL: Do NOT translate technology names, frameworks, libraries, databases, or tools (e.g., Next.js, React, RAG, LangChain, LangGraph, Supabase, Tailwind CSS, Docker, PostgreSQL, Gemini, LLM, API, CTF, Full-Stack, etc.). Keep all technical brand names and software terms in their original English forms.";

export const MAX_CHARS = 5000;

/**
 * Upper bound on what one call may generate. Turkish output for 5,000
 * characters of English is roughly 3,000 tokens; the headroom is for models
 * that count internal "thinking" tokens against this limit (a tight cap would
 * return an empty or cut-off translation). It still bounds the cost of one
 * anonymous call to a fixed ceiling.
 */
export const MAX_OUTPUT_TOKENS = 8192;

/** A hung upstream call must not hold a server worker open indefinitely. */
const UPSTREAM_TIMEOUT_MS = 30_000;

/** Free-tier friendly default; override with GEMINI_MODEL if needed. */
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * `message` is the detail for the server log and may name internals (an env
 * var, the upstream's own wording). `publicMessage` is the only text a caller
 * ever receives.
 */
export class TranslateError extends Error {
  status: number;
  publicMessage: string;

  constructor(message: string, status: number, publicMessage?: string) {
    super(message);
    this.name = "TranslateError";
    this.status = status;
    this.publicMessage = publicMessage ?? message;
  }
}

const UNAVAILABLE = "Translation is unavailable";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new TranslateError(
      "GEMINI_API_KEY is not configured on the server",
      503,
      UNAVAILABLE,
    );
  }
  return key;
}

function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function mapGeminiError(error: unknown): TranslateError {
  if (error instanceof TranslateError) return error;

  const message =
    error instanceof Error ? error.message : "Translation failed";
  const lower = message.toLowerCase();

  if (
    /api[_ ]?key|credential|unauthenticated|permission|401|403/.test(lower)
  ) {
    return new TranslateError(
      `Gemini API authentication failed: ${message}`,
      503,
      UNAVAILABLE,
    );
  }
  if (/429|rate[_ ]?limit|quota|resource.?exhausted|too many/.test(lower)) {
    return new TranslateError(
      `Gemini rate limit exceeded: ${message}`,
      429,
      "Translation is busy. Please try again shortly.",
    );
  }

  return new TranslateError(message, 502, "Translation failed");
}

/**
 * EN→TR translation via Google Gemini (keeps tech terms in English via system instruction).
 */
export async function translateText({
  text,
}: TranslateInput): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new TranslateError("text is required", 400);
  }
  if (trimmed.length > MAX_CHARS) {
    throw new TranslateError(`text exceeds ${MAX_CHARS} characters`, 400);
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  try {
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Translate the following English text to Turkish. Return only the Turkish translation with no quotes, labels, or commentary.\n\n${trimmed}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: TRANSLATOR_SYSTEM_INSTRUCTION,
        temperature: 0.2,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    });

    // A cut-off translation must not be returned as if it were complete.
    if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      throw new TranslateError(
        `Gemini stopped at the ${MAX_OUTPUT_TOKENS} output-token cap`,
        502,
        "Translation failed",
      );
    }

    const translatedText = response.text?.trim();
    if (!translatedText) {
      throw new TranslateError(
        "Gemini returned an empty translation",
        502,
        "Translation failed",
      );
    }

    return { translatedText };
  } catch (error) {
    throw mapGeminiError(error);
  }
}
