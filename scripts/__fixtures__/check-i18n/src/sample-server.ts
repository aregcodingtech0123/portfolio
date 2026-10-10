import { getTranslations } from "next-intl/server";

export async function sampleServer() {
  const t = await getTranslations({ locale: "en", namespace: "Greeting" });
  return t("hello");
}
