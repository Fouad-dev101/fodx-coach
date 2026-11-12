export type Lang = 'fr' | 'ar' | 'en'
export type PdfLang = Lang | 'bilingual'
export type PdfStyle = 'clean' | 'bold' | 'minimal'
export type Level = 'beginner' | 'intermediate' | 'advanced'

export const MUSCLES = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'fullbody', 'cardio',
] as const
export type Muscle = (typeof MUSCLES)[number]

export interface Client {
  id: string
  name: string
  goal: string
  level: Level
  daysPerWeek: number
  notes: string
  createdAt: number
  updatedAt: number
}

export type Measure = 'reps' | 'time'

export interface ExerciseDefaults {
  sets: number
  reps: string
  durationSec: number | null
  restSec: number | null
}

export interface Exercise {
  id: string
  names: Record<Lang, string>
  muscle: Muscle
  builtin: boolean
  archived?: boolean
  /** 'time' for plank, cardio, stretching... shown as a duration instead of reps */
  measure: Measure
  defaults?: ExerciseDefaults
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  measure: Measure
  sets: number
  reps: string // string on purpose: "8-10", "AMRAP"
  durationSec: number | null // used when measure === 'time'
  restSec: number | null
  load: string // optional: "60 kg", "RPE 8", "70%"
  notes: string
  superset: boolean // linked with the NEXT entry (A1/A2 style)
}

export interface Day {
  id: string
  name: string
  focus: string
  entries: ExerciseEntry[]
}

export interface Week {
  id: string
  label: string
  days: Day[]
}

export interface Program {
  id: string
  clientId: string | null
  isTemplate: boolean
  title: string
  pdfLang: PdfLang
  pdfStyle: PdfStyle
  coachNote: string
  showEstimate: boolean
  weeks: Week[]
  createdAt: number
  updatedAt: number
}

export interface Branding {
  coachName: string
  instagram: string
  accent: string
  logoDataUrl?: string
  showQr?: boolean
}

export interface Settings {
  uiLang: Lang
  branding: Branding
}

export interface Backup {
  schemaVersion: 1
  exportedAt: number
  clients: Client[]
  programs: Program[]
  exercises: Exercise[]
  settings: Settings
}
