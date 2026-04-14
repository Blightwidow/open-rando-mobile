import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Locale, getSystemLocale, setLocale as setI18nLocale } from "@/lib/i18n";

interface SettingsState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: getSystemLocale(),
      setLocale: (locale: Locale) => {
        setI18nLocale(locale);
        set({ locale });
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          setI18nLocale(state.locale);
        }
      },
    },
  ),
);
