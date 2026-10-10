import { useTranslations } from "next-intl";

const dynamicKey = "hello";

export function sample() {
  const t = useTranslations("Greeting");
  return [t("hello"), t("bye"), t("missingKey"), t(dynamicKey)];
}
