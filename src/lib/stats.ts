import type { Day, Exercise, ExerciseEntry, Muscle, Week } from '../types/model'

export function avgReps(reps: string): number {
  const nums = reps.match(/\d+/g)?.map(Number)
  if (!nums?.length) return 10
  return nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0]
}

export function entrySeconds(e: ExerciseEntry): number {
  const sets = Math.max(0, e.sets)
  const work = e.measure === 'time' ? e.durationSec ?? 30 : avgReps(e.reps) * 3
  const rest = e.restSec ?? 0
  return sets * work + Math.max(0, sets - 1) * rest + 45 // +45 s to set up / switch machine
}

/** Rough session length in minutes, rounded to the nearest 5. 0 when the day is empty. */
export function dayMinutes(day: Day): number {
  if (day.entries.length === 0) return 0
  const sec = day.entries.reduce((n, e) => n + entrySeconds(e), 0)
  return Math.max(5, Math.round(sec / 300) * 5)
}

/** Working sets per muscle for one week (warm-up and cardio are not counted). */
export function volumeByMuscle(week: Week, exMap: Map<string, Exercise>): [Muscle, number][] {
  const acc = new Map<Muscle, number>()
  for (const d of week.days)
    for (const e of d.entries) {
      const m = exMap.get(e.exerciseId)?.muscle
      if (!m || m === 'fullbody' || m === 'cardio') continue
      acc.set(m, (acc.get(m) ?? 0) + e.sets)
    }
  return [...acc.entries()].sort((a, b) => b[1] - a[1])
}
