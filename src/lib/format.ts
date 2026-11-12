import type { ExerciseEntry, Lang } from '../types/model'

export const DEFAULT_DAY = /^(jour|day|اليوم)\s*\d+$/i
export const DEFAULT_WEEK = /^(semaine|week|الأسبوع)\s*\d+$/i

export const UNITS: Record<Lang, { s: string; min: string }> = {
  fr: { s: 's', min: 'min' },
  en: { s: 's', min: 'min' },
  ar: { s: 'ث', min: 'د' },
}
const UNITS_LONG: Record<Lang, { s: string; min: string }> = {
  fr: { s: 's', min: 'min' },
  en: { s: 's', min: 'min' },
  ar: { s: 'ثانية', min: 'دقيقة' },
}

/** 45 -> 45 s, 600 -> 10 min, 90 -> 1:30 min. Value and unit stay separate so Arabic bidi cannot scramble them. */
export function splitDuration(sec: number): { value: string; unit: 's' | 'min' } {
  if (sec >= 60 && sec % 60 === 0) return { value: String(sec / 60), unit: 'min' }
  if (sec > 60) return { value: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, unit: 'min' }
  return { value: String(sec), unit: 's' }
}

export function durationText(sec: number, lang: Lang) {
  const d = splitDuration(sec)
  return `${d.value} ${UNITS_LONG[lang][d.unit]}`
}

/** Labels like 1, 2a, 2b, 3 : entries flagged `superset` are linked with the next one. */
export function entryLabels(entries: ExerciseEntry[]): string[] {
  const out: string[] = []
  let n = 0
  let i = 0
  while (i < entries.length) {
    n++
    let j = i
    while (j < entries.length - 1 && entries[j].superset) j++
    if (j === i) out.push(String(n))
    else for (let k = i; k <= j; k++) out.push(`${n}${'abcdefgh'[k - i] ?? ''}`)
    i = j + 1
  }
  return out
}
