import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { translations, type Locale } from "@/lib/i18n"

const LANG_KEY = "soleim_lang"

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem(LANG_KEY) as Locale | null) ?? "es"
  )

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(LANG_KEY, newLocale)
    setLocaleState(newLocale)
    window.dispatchEvent(new CustomEvent("solein:lang-change", { detail: newLocale }))
  }

  // Sincronizar si otro componente cambia el idioma
  useEffect(() => {
    const handler = (e: Event) => {
      const lang = (e as CustomEvent<Locale>).detail
      setLocaleState(lang)
    }
    window.addEventListener("solein:lang-change", handler)
    return () => window.removeEventListener("solein:lang-change", handler)
  }, [])

  const t = (key: string, fallback?: string): string =>
    translations[locale]?.[key] ??
    translations["es"]?.[key] ??
    fallback ??
    key

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
