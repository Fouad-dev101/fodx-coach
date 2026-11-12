import { useCallback, useEffect } from 'react'
import { useStore } from '../store/useStore'
import type { Key } from './dict'
import { translate } from './translate'
import type { Lang } from '../types/model'

export type { Key }
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' },
]

export { translate }

export function useT() {
  const lang = useStore((s) => s.settings.uiLang)
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
  return { t, lang, dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const) }
}

/** Keeps <html lang dir> in sync with the chosen UI language. */
export function useHtmlLang() {
  const { lang, dir } = useT()
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])
}
