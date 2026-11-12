import type { Day, Exercise, ExerciseEntry, Lang, Level, Muscle } from '../types/model'
import { uid } from './id'
import { makeEntry } from './entry'

export type Goal = 'muscle' | 'fatloss' | 'strength'
type Key = 'fullbody' | 'push' | 'pull' | 'legs' | 'upper' | 'lower'

const DAYS: Record<Key, [Muscle, number][]> = {
  fullbody: [['quads', 1], ['chest', 1], ['back', 1], ['shoulders', 1], ['hamstrings', 1], ['abs', 1]],
  push: [['chest', 3], ['shoulders', 2], ['triceps', 2]],
  pull: [['back', 4], ['biceps', 2], ['abs', 1]],
  legs: [['quads', 2], ['hamstrings', 2], ['glutes', 1], ['calves', 1]],
  upper: [['chest', 2], ['back', 2], ['shoulders', 1], ['biceps', 1], ['triceps', 1]],
  lower: [['quads', 2], ['hamstrings', 1], ['glutes', 1], ['calves', 1], ['abs', 1]],
}

const SPLITS: Record<number, Key[]> = {
  1: ['fullbody'],
  2: ['fullbody', 'fullbody'],
  3: ['push', 'pull', 'legs'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  7: ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'fullbody'],
}

const FOCUS: Record<Key, Record<Lang, string>> = {
  fullbody: { fr: 'Corps entier', en: 'Full body', ar: 'الجسم كاملاً' },
  push: { fr: 'Poussée : pectoraux, épaules, triceps', en: 'Push: chest, shoulders, triceps', ar: 'دفع: الصدر والأكتاف والترايسبس' },
  pull: { fr: 'Tirage : dos, biceps', en: 'Pull: back, biceps', ar: 'سحب: الظهر والبايسبس' },
  legs: { fr: 'Jambes', en: 'Legs', ar: 'الأرجل' },
  upper: { fr: 'Haut du corps', en: 'Upper body', ar: 'الجزء العلوي' },
  lower: { fr: 'Bas du corps', en: 'Lower body', ar: 'الجزء السفلي' },
}

// Preferred order per muscle (English names of the seed library). Compounds first.
const PREF: Record<Muscle, string[]> = {
  chest: ['Bench press', 'Incline dumbbell press', 'Dumbbell fly', 'Cable crossover', 'Push-up', 'Incline bench press', 'Chest dips', 'Pec deck'],
  back: ['Lat pulldown', 'Barbell row', 'Seated cable row', 'One-arm dumbbell row', 'Pull-up', 'Face pull', 'T-bar row', 'Deadlift'],
  shoulders: ['Dumbbell shoulder press', 'Lateral raise', 'Rear delt fly', 'Overhead press', 'Front raise', 'Shrug', 'Upright row'],
  biceps: ['Barbell curl', 'Hammer curl', 'Cable curl', 'Dumbbell curl', 'Preacher curl'],
  triceps: ['Triceps pushdown', 'Overhead triceps extension', 'Close-grip bench press', 'Skull crusher', 'Bench dips'],
  forearms: ['Wrist curl', "Farmer's walk"],
  quads: ['Squat', 'Leg press', 'Walking lunge', 'Leg extension', 'Bulgarian split squat', 'Front squat', 'Hack squat'],
  hamstrings: ['Romanian deadlift', 'Lying leg curl', 'Seated leg curl', 'Good morning'],
  glutes: ['Hip thrust', 'Glute bridge', 'Cable kickback', 'Step-up'],
  calves: ['Standing calf raise', 'Seated calf raise'],
  abs: ['Plank', 'Crunch', 'Hanging leg raise', 'Cable crunch', 'Russian twist', 'Ab wheel rollout'],
  fullbody: ['Burpee', 'Kettlebell swing'],
  cardio: ['Treadmill run', 'Stationary bike', 'Rowing machine', 'Jump rope'],
}

const COMPOUND = new Set([
  'Bench press', 'Incline bench press', 'Overhead press', 'Squat', 'Front squat', 'Deadlift', 'Romanian deadlift',
  'Barbell row', 'Pull-up', 'Lat pulldown', 'Leg press', 'Hip thrust', 'Close-grip bench press', 'Dumbbell shoulder press',
])

const SCHEME: Record<Goal, { compound: [number, string, number]; iso: [number, string, number] }> = {
  muscle: { compound: [4, '6-8', 120], iso: [3, '10-12', 60] },
  fatloss: { compound: [3, '12', 60], iso: [3, '15', 45] },
  strength: { compound: [5, '5', 180], iso: [3, '8-10', 90] },
}

export interface GenOpts {
  days: number
  goal: Goal
  level: Level
  warmup: boolean
  dayLabel: string
}

export function generateDays(o: GenOpts, exercises: Exercise[], lang: Lang): Day[] {
  const pool = exercises.filter((e) => !e.archived)
  const byEn = new Map(pool.map((e) => [e.names.en, e]))
  const n = Math.min(7, Math.max(1, o.days))
  const keys = o.level === 'beginner' && n === 3 ? (['fullbody', 'fullbody', 'fullbody'] as Key[]) : SPLITS[n]
  const seen: Record<string, number> = {}
  const cardio = PREF.cardio.map((x) => byEn.get(x)).filter(Boolean) as Exercise[]

  return keys.map((key, di) => {
    const entries: ExerciseEntry[] = []
    const used = new Set<string>()
    const warm = byEn.get('Warm-up')
    if (o.warmup && warm) entries.push(makeEntry(warm))

    for (const [muscle, count0] of DAYS[key]) {
      const count = o.level === 'beginner' ? Math.max(1, Math.round(count0 * 0.7)) : count0
      const occ = seen[muscle] ?? 0
      seen[muscle] = occ + 1
      let list = PREF[muscle].map((x) => byEn.get(x)).filter(Boolean) as Exercise[]
      if (occ > 0 && list.length > 1) {
        const r = occ % list.length
        list = [...list.slice(r), ...list.slice(0, r)]
      }
      for (const ex of pool.filter((e) => e.muscle === muscle && !list.includes(e))) list.push(ex)
      let picked = 0
      for (const ex of list) {
        if (picked >= count) break
        if (used.has(ex.id)) continue
        used.add(ex.id)
        picked++
        const e = makeEntry(ex)
        if (ex.measure === 'reps') {
          const [s, r, rest] = SCHEME[o.goal][COMPOUND.has(ex.names.en) ? 'compound' : 'iso']
          Object.assign(e, { sets: s, reps: r, restSec: rest })
        }
        entries.push(e)
      }
    }

    if (o.goal === 'fatloss' && cardio.length) {
      const c = makeEntry(cardio[di % cardio.length])
      c.durationSec = 600
      entries.push(c)
    }
    return { id: uid(), name: `${o.dayLabel} ${di + 1}`, focus: FOCUS[key][lang], entries }
  })
}
