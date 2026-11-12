// Generates sample PDFs (FR / AR / bilingual / EN) without a browser. Run: npm run sample
import { renderToFile } from '@react-pdf/renderer'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import QRCode from 'qrcode'
import ProgramPdf from '../src/pdf/ProgramPdf'
import { registerPdfFonts } from '../src/pdf/fonts'
import { seedExercises } from '../src/data/seedExercises'
import { makeEntry } from '../src/lib/entry'
import { uid } from '../src/lib/id'
import type { Client, Day, ExerciseEntry, PdfLang, PdfStyle, Program } from '../src/types/model'

const root = resolve(import.meta.dirname, '..')
registerPdfFonts(resolve(root, 'public/fonts') + '/')
const exercises = seedExercises()
const byEn = (en: string) => exercises.find((e) => e.names.en === en)!

function e(en: string, patch: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return { ...makeEntry(byEn(en)), ...patch }
}
const day = (name: string, focus: string, entries: ExerciseEntry[]): Day => ({ id: uid(), name, focus, entries })

const client: Client = {
  id: 'c1', name: 'Mouad B.', goal: 'Perte de poids', level: 'beginner', daysPerWeek: 4, notes: '',
  createdAt: 0, updatedAt: 0,
}

const week = (label: string) => ({
  id: uid(), label,
  days: [
    day('Jour 1', 'Lundi : Push', [
      e('Warm-up'),
      e('Bench press', { sets: 4, reps: '8-10', restSec: 90, load: 'RPE 8', notes: 'Contrôle la descente, 2 s' }),
      e('Incline bench press', { sets: 3, reps: '10', restSec: 75, load: 'RPE 8' }),
      e('Dumbbell shoulder press', { sets: 3, reps: '10', restSec: 60, load: 'RPE 7', superset: true }),
      e('Lateral raise', { sets: 4, reps: '12-15', restSec: 60, load: 'RPE 7' }),
      e('Chest dips', { sets: 3, reps: '10', restSec: 60 }),
      e('Triceps pushdown', { sets: 3, reps: '12', restSec: 45, superset: true }),
      e('Overhead triceps extension', { sets: 3, reps: '12', restSec: 45 }),
      e('Plank'),
    ]),
    day('Jour 2', 'Mercredi : Pull', [
      e('Stationary bike', { durationSec: 300 }),
      e('Lat pulldown', { sets: 3, reps: '10', restSec: 60 }),
      e('Seated cable row', { sets: 3, reps: '10', restSec: 60 }),
      e('One-arm dumbbell row', { sets: 3, reps: '10', restSec: 60 }),
      e('Barbell curl', { sets: 3, reps: '10', restSec: 60 }),
      e('Hammer curl', { sets: 3, reps: '10', restSec: 60 }),
      e('Wrist curl', { sets: 3, reps: '15', restSec: 45, notes: 'Toujours en dernier pour garder de la force' }),
      e('Crunch', { sets: 3, reps: '15', restSec: 45 }),
    ]),
    day('Jour 3', 'Jeudi : Jambes', [
      e('Stationary bike', { durationSec: 300 }),
      e('Front squat', { sets: 4, reps: '8', restSec: 90 }),
      e('Romanian deadlift', { sets: 3, reps: '10', restSec: 75 }),
      e('Leg extension', { sets: 3, reps: '12', restSec: 60 }),
      e('Seated leg curl', { sets: 3, reps: '12', restSec: 60 }),
      e('Glute bridge', { sets: 3, reps: '12', restSec: 60 }),
      e('Seated calf raise', { sets: 4, reps: '15', restSec: 45 }),
      e('Hanging leg raise', { sets: 3, reps: '12', restSec: 45 }),
      e('Plank', { durationSec: 60 }),
    ]),
    day('Jour 4', 'Samedi : Cardio', [
      e('Treadmill run', { durationSec: 900 }),
      e('Rowing machine', { durationSec: 600 }),
      e('Jump rope', { sets: 4, durationSec: 60, restSec: 30 }),
      e('Stationary bike', { durationSec: 600 }),
      e('Stretching'),
    ]),
  ],
})

function program(pdfLang: PdfLang, pdfStyle: PdfStyle, weeks: number): Program {
  return {
    id: uid(), clientId: 'c1', isTemplate: false, title: 'Perte de poids, 4 jours', pdfLang, pdfStyle,
    coachNote: 'Écoute ton corps, bois 3 L d’eau par jour et envoie-moi ta photo chaque dimanche.',
    showEstimate: true,
    weeks: Array.from({ length: weeks }, (_, i) => week(`Semaine ${i + 1}`)),
    createdAt: 0, updatedAt: 0,
  }
}

const branding = { coachName: 'Coach Youssef B.', instagram: 'youssef.coach', accent: '#22D3EE', showQr: true }
const qr = await QRCode.toDataURL('https://instagram.com/youssef.coach', { margin: 1, width: 240 })
mkdirSync(resolve(root, 'sample-output'), { recursive: true })

const jobs: [string, PdfLang, PdfStyle, number][] = [
  ['sample-fr-clean', 'fr', 'clean', 2],
  ['sample-ar-bold', 'ar', 'bold', 1],
  ['sample-bilingual-minimal', 'bilingual', 'minimal', 1],
  ['sample-en-bold', 'en', 'bold', 1],
]
for (const [name, lang, style, weeks] of jobs) {
  const p = program(lang, style, weeks)
  if (lang === 'ar') p.coachNote = 'اشرب 3 لترات من الماء يومياً، نم 7 ساعات على الأقل، وأرسل لي صورتك كل يوم أحد.'
  await renderToFile(
    <ProgramPdf program={p} client={client} exercises={exercises} branding={branding} qrDataUrl={qr} />,
    resolve(root, `sample-output/${name}.pdf`),
  )
  console.log('ok', name)
}
