import type { Exercise, ExerciseEntry } from '../types/model'
import { uid } from './id'

/** New row for a day. Reps exercises copy the previous reps row, so a whole day is quick to fill. */
export function makeEntry(ex: Exercise, prev?: ExerciseEntry): ExerciseEntry {
  const d = ex.defaults
  const base = { id: uid(), exerciseId: ex.id, load: '', notes: '', superset: false }
  if (ex.measure === 'time') {
    return {
      ...base, measure: 'time', sets: d?.sets ?? 1, reps: '',
      durationSec: d?.durationSec ?? 60, restSec: d?.restSec ?? null,
    }
  }
  const p = prev && prev.measure === 'reps' ? prev : undefined
  return {
    ...base, measure: 'reps',
    sets: p?.sets ?? d?.sets ?? 3,
    reps: p?.reps ?? (d?.reps || '10'),
    durationSec: null,
    restSec: p ? p.restSec : d?.restSec ?? 60,
  }
}
