import { t } from "@/lib/i18n";

const PHONE_PATTERN = /^\+?[0-9][0-9 .()-]{3,}$/;

/** A `tel:` link target, or null when the value does not look like a phone number. */
export function normalizePhone(rawPhone: string | null | undefined): string | null {
  const firstPhone = rawPhone?.split(";")[0].trim();
  if (!firstPhone || !PHONE_PATTERN.test(firstPhone)) return null;
  return `tel:${firstPhone.replace(/[^0-9+]/g, "")}`;
}

/** The phone as shown: the first of several, trimmed. */
export function displayPhone(rawPhone: string | null | undefined): string | null {
  return rawPhone?.split(";")[0].trim() || null;
}

/**
 * Name of a POI's kind. A shop or eatery reads as its category ("Bakery"); a category the app
 * does not know yet reads as the raw OSM value, so newer data never shows a translation key.
 */
export function poiTypeLabel(poiType: string, category?: string | null): string {
  if (category) {
    const key = `poi.category.${category}`;
    const translated = t(key);
    return translated === key ? category.replaceAll("_", " ") : translated;
  }
  const key = `poi.${poiType}`;
  const translated = t(key);
  return translated === key ? poiType.replaceAll("_", " ") : translated;
}
