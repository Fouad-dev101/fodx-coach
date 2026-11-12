import { dict, type Key } from './dict'
import type { Lang } from '../types/model'

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>) {
  let s: string = dict[lang][key] ?? dict.fr[key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
