import { useTranslations } from "next-intl";

const STATUS_KEY = {
  active: "active",
  archived: "archived",
} as const;

export function sampleLookup(status: "active" | "archived") {
  const t = useTranslations("Status");
  return t(STATUS_KEY[status]);
}

export function sampleTemplateLookup(status: "active" | "archived") {
  const t = useTranslations("Status");
  return t(`prefix.${STATUS_KEY[status]}`);
}
