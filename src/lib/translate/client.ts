export type TranslateRequest = {
  text: string;
};

export type TranslateResponse = {
  translatedText: string;
};

/**
 * Shown to the editor (this runs only inside the Studio). The server answers
 * 404 with no explanation when translate is switched off, so the hint lives
 * here, where it reaches the one person who can act on it.
 */
const DISABLED_HINT =
  "Translation is turned off on this deployment. Set TRANSLATE_ENABLED=true (and GEMINI_API_KEY) to use it.";

/**
 * Call POST /api/translate from React components or Sanity Studio inputs.
 *
 * @example
 * const { translatedText } = await requestTranslation({
 *   text: "Built RAG pipelines with Next.js and LangChain.",
 * });
 */
export async function requestTranslation(
  body: TranslateRequest,
  init?: RequestInit,
): Promise<TranslateResponse> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify({ text: body.text }),
    ...init,
  });

  if (res.status === 404) throw new Error(DISABLED_HINT);

  // An error from a proxy or the host can be HTML, not JSON.
  const data = (await res.json().catch(() => ({}))) as Partial<TranslateResponse> & {
    error?: string;
  };
  if (!res.ok || typeof data.translatedText !== "string") {
    throw new Error(data.error || `Translate request failed (${res.status})`);
  }
  return data as TranslateResponse;
}
