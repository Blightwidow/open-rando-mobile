import { useSettingsStore } from "@/stores/settings-store";

/**
 * Subscribe to locale changes so components re-render when the language switches.
 * Use t() from i18n.ts for the actual translation strings.
 */
export function useLocale() {
  return useSettingsStore((state) => state.locale);
}
