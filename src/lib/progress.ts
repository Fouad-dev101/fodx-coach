import type { Week } from '../types/model'
import { cloneWeek } from './clone'

export function progressReps(reps: string, delta: number): string {
  const r = reps.trim()
  if (delta === 0) return reps
  if (/^\d+$/.test(r)) return String(Number(r) + delta)
  const m = r.match(/^(\d+)\s*-\s*(\d+)$/)
  if (m) return `${Number(m[1]) + delta}-${Number(m[2]) + delta}`
  return reps
}

export interface ProgressOpts {
  weeks: number // how many weeks to add
  repsStep: number // + reps per week
  restStep: number // - seconds of rest per week
  timeStep: number // + seconds per week on timed exercises
  addSetEvery: number // +1 set every N weeks (0 = never)
  deload: boolean // make the last generated week a lighter one
}

/** Builds weeks N+1.. from `source`, each a bit harder than the one before. */
export function buildProgressionWeeks(
  source: Week,
  existing: number,
  o: ProgressOpts,
  words: { week: string; deload: string },
): Week[] {
  const out: Week[] = []
  for (let i = 1; i <= o.weeks; i++) {
    const isDeload = o.deload && i === o.weeks && o.weeks > 1
    const k = isDeload ? i - 1 : i
    const label = `${words.week} ${existing + i}${isDeload ? ` (${words.deload})` : ''}`
    const w = cloneWeek(source, label)
    for (const d of w.days)
      for (const e of d.entries) {
        if (e.measure === 'reps') e.reps = progressReps(e.reps, o.repsStep * k)
        else if (e.durationSec != null) e.durationSec = e.durationSec + o.timeStep * k
        if (e.restSec != null && o.restStep > 0) e.restSec = Math.max(15, e.restSec - o.restStep * k)
        if (o.addSetEvery > 0) e.sets += Math.floor(k / o.addSetEvery)
        if (isDeload) e.sets = Math.max(1, Math.round(e.sets * 0.6))
      }
    out.push(w)
  }
  return out
}
