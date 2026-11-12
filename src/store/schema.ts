import { z } from 'zod'
import { MUSCLES } from '../types/model'
import type { Backup } from '../types/model'

const lang3 = z.object({ fr: z.string(), ar: z.string(), en: z.string() })

const client = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number(),
  notes: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const exercise = z.object({
  id: z.string(),
  names: lang3,
  muscle: z.enum(MUSCLES),
  builtin: z.boolean(),
  archived: z.boolean().optional(),
  measure: z.enum(['reps', 'time']).default('reps'),
  defaults: z
    .object({
      sets: z.number(),
      reps: z.string(),
      durationSec: z.number().nullable(),
      restSec: z.number().nullable(),
    })
    .optional(),
})

const entry = z.object({
  id: z.string(),
  exerciseId: z.string(),
  measure: z.enum(['reps', 'time']).default('reps'),
  sets: z.number(),
  reps: z.string(),
  durationSec: z.number().nullable().default(null),
  restSec: z.number().nullable(),
  load: z.string().default(''),
  notes: z.string(),
  superset: z.boolean().default(false),
})

const day = z.object({ id: z.string(), name: z.string(), focus: z.string(), entries: z.array(entry) })
const week = z.object({ id: z.string(), label: z.string(), days: z.array(day) })

const program = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  isTemplate: z.boolean(),
  title: z.string(),
  pdfLang: z.enum(['fr', 'ar', 'en', 'bilingual']),
  pdfStyle: z.enum(['clean', 'bold', 'minimal']),
  coachNote: z.string(),
  showEstimate: z.boolean().default(true),
  weeks: z.array(week),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const settings = z.object({
  uiLang: z.enum(['fr', 'ar', 'en']),
  branding: z.object({
    coachName: z.string(),
    instagram: z.string(),
    accent: z.string(),
    logoDataUrl: z.string().optional(),
    showQr: z.boolean().optional(),
  }),
})

export const backupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.number(),
  clients: z.array(client),
  programs: z.array(program),
  exercises: z.array(exercise),
  settings,
})

export function parseBackup(raw: unknown): Backup | null {
  const r = backupSchema.safeParse(raw)
  return r.success ? (r.data as Backup) : null
}
