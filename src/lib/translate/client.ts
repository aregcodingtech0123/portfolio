export type TranslateRequest = {
  text: string;
};

export type TranslateResponse = {
  translatedText: string;
};

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

  const data = (await res.json()) as TranslateResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Translate request failed (${res.status})`);
  }
  return data;
}
