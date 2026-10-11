import { GoogleGenAI } from "@google/genai";

export type TranslateInput = {
  text: string;
};

export type TranslateResult = {
  translatedText: string;
};

export const TRANSLATOR_SYSTEM_INSTRUCTION =
  "You are an expert technical translator specializing in software engineering, AI, and cybersecurity. Translate the provided English text into natural, professional Turkish. CRITICAL: Do NOT translate technology names, frameworks, libraries, databases, or tools (e.g., Next.js, React, RAG, LangChain, LangGraph, Supabase, Tailwind CSS, Docker, PostgreSQL, Gemini, LLM, API, CTF, Full-Stack, etc.). Keep all technical brand names and software terms in their original English forms.";

const MAX_CHARS = 5000;

/** Free-tier friendly default; override with GEMINI_MODEL if needed. */
const DEFAULT_MODEL = "gemini-2.5-flash";

export class TranslateError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TranslateError";
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new TranslateError(
      "GEMINI_API_KEY is not configured on the server",
      503,
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
      "Gemini API authentication failed. Check GEMINI_API_KEY.",
      503,
    );
  }
  if (/429|rate[_ ]?limit|quota|resource.?exhausted|too many/.test(lower)) {
    return new TranslateError(
      "Gemini rate limit exceeded. Please try again shortly.",
      429,
    );
  }

  return new TranslateError(message, 502);
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
      },
    });

    const translatedText = response.text?.trim();
    if (!translatedText) {
      throw new TranslateError("Gemini returned an empty translation", 502);
    }

    return { translatedText };
  } catch (error) {
    throw mapGeminiError(error);
  }
}
