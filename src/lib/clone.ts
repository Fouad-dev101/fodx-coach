import type { Day, Program, Week } from '../types/model'
import { uid } from './id'

/** Deep-copy a day and give every entry a fresh id. */
export function cloneDay(day: Day): Day {
  return {
    ...day,
    id: uid(),
    entries: day.entries.map((e) => ({ ...e, id: uid() })),
  }
}

export function cloneWeek(week: Week, label?: string): Week {
  return {
    ...week,
    id: uid(),
    label: label ?? week.label,
    days: week.days.map(cloneDay),
  }
}

/** Used for "copy from template" and "save as template". */
export function cloneProgram(p: Program, patch: Partial<Program>): Program {
  const now = Date.now()
  return {
    ...p,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    weeks: p.weeks.map((w) => cloneWeek(w)),
    ...patch,
  }
}
