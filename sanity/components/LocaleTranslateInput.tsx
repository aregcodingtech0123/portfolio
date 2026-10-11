"use client";

import { useState } from "react";
import { set, type ObjectInputProps } from "sanity";
import { Button, Card, Stack, Text } from "@sanity/ui";
import { TranslateIcon } from "@sanity/icons";
import { requestTranslation } from "@/lib/translate/client";

type LocaleValue = {
  en?: string;
  tr?: string;
};

/**
 * Wraps localeString / localeText inputs with an EN→TR Gemini translate action.
 * Populates the Turkish field from the English value via POST /api/translate.
 */
export function LocaleTranslateInput(props: ObjectInputProps<LocaleValue>) {
  const { value, onChange, renderDefault } = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const english = value?.en?.trim() ?? "";

  async function handleTranslate() {
    if (!english || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { translatedText } = await requestTranslation({ text: english });
      onChange(set(translatedText, ["tr"]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap={3}>
      {renderDefault(props)}
      <Stack gap={2}>
        <Button
          icon={TranslateIcon}
          text={loading ? "Translating…" : "Translate EN → TR"}
          mode="ghost"
          tone="primary"
          disabled={!english || loading}
          onClick={handleTranslate}
        />
        {error ? (
          <Card padding={2} radius={2} tone="critical">
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}
      </Stack>
    </Stack>
  );
}
