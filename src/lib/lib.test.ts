import { describe, it, expect } from 'vitest'
import { progressReps, buildProgressionWeeks } from './progress'
import { entryLabels, splitDuration } from './format'
import { dayMinutes } from './stats'
import { generateDays } from './generator'
import { makeEntry } from './entry'
import { programToText } from './whatsapp'
import { seedExercises } from '../data/seedExercises'
import { parseBackup } from '../store/schema'
import type { Program } from '../types/model'

const ex = seedExercises()
const by = (en: string) => ex.find((e) => e.names.en === en)!

describe('helpers', () => {
  it('progresses reps and ranges, leaves text alone', () => {
    expect(progressReps('10', 2)).toBe('12')
    expect(progressReps('8-10', 1)).toBe('9-11')
    expect(progressReps('AMRAP', 2)).toBe('AMRAP')
  })

  it('formats durations without mixing digits and units', () => {
    expect(splitDuration(45)).toEqual({ value: '45', unit: 's' })
    expect(splitDuration(600)).toEqual({ value: '10', unit: 'min' })
    expect(splitDuration(90)).toEqual({ value: '1:30', unit: 'min' })
  })

  it('labels supersets 2a/2b', () => {
    const a = makeEntry(by('Bench press'))
    const b = { ...makeEntry(by('Squat')), superset: true }
    const c = makeEntry(by('Plank'))
    const d = makeEntry(by('Crunch'))
    expect(entryLabels([a, b, c, d])).toEqual(['1', '2a', '2b', '3'])
  })

  it('timed exercises default to a duration, reps exercises copy the previous row', () => {
    const plank = makeEntry(by('Plank'))
    expect(plank.measure).toBe('time')
    expect(plank.durationSec).toBe(45)
    const prev = { ...makeEntry(by('Bench press')), sets: 5, reps: '5', restSec: 150 }
    const next = makeEntry(by('Lateral raise'), prev)
    expect([next.sets, next.reps, next.restSec]).toEqual([5, '5', 150])
  })

  it('estimates session length', () => {
    const day = { id: 'd', name: 'x', focus: '', entries: [makeEntry(by('Treadmill run'))] }
    expect(dayMinutes(day)).toBe(10) // 10 min run + setup rounds to 10
    expect(dayMinutes({ ...day, entries: [] })).toBe(0)
  })
})

describe('generator and progression', () => {
  it('builds a 4 day upper/lower split with a warm-up and goal schemes', () => {
    const days = generateDays({ days: 4, goal: 'strength', level: 'intermediate', warmup: true, dayLabel: 'Day' }, ex, 'en')
    expect(days).toHaveLength(4)
    expect(days[0].entries[0].measure).toBe('time') // warm-up
    const bench = days.flatMap((d) => d.entries).find((e) => e.exerciseId === by('Bench press').id)!
    expect([bench.sets, bench.reps, bench.restSec]).toEqual([5, '5', 180])
    expect(days[1].focus).toBe('Lower body')
  })

  it('fat loss adds a timed cardio finisher every day', () => {
    const days = generateDays({ days: 3, goal: 'fatloss', level: 'beginner', warmup: false, dayLabel: 'Day' }, ex, 'en')
    for (const d of days) {
      const last = d.entries[d.entries.length - 1]
      expect(last.measure).toBe('time')
      expect(last.durationSec).toBe(600)
    }
  })

  it('progression adds harder weeks and a lighter deload', () => {
    const days = generateDays({ days: 3, goal: 'muscle', level: 'beginner', warmup: false, dayLabel: 'Day' }, ex, 'en')
    const base = { id: 'w', label: 'Week 1', days }
    const weeks = buildProgressionWeeks(base, 1, { weeks: 3, repsStep: 1, restStep: 0, timeStep: 0, addSetEvery: 0, deload: true }, { week: 'Week', deload: 'deload' })
    expect(weeks).toHaveLength(3)
    expect(weeks[2].label).toBe('Week 4 (deload)')
    const e0 = base.days[0].entries.find((e) => e.measure === 'reps')!
    const e1 = weeks[0].days[0].entries.find((e) => e.exerciseId === e0.exerciseId)!
    expect(e1.id).not.toBe(e0.id)
    expect(e1.sets).toBe(e0.sets)
    const lite = weeks[2].days[0].entries.find((e) => e.exerciseId === e0.exerciseId)!
    expect(lite.sets).toBeLessThan(e0.sets)
  })
})

describe('compat and text export', () => {
  it('accepts a backup written before timed exercises existed', () => {
    const old = {
      schemaVersion: 1, exportedAt: 1, clients: [], exercises: [{ id: 'a', names: { fr: 'a', ar: 'a', en: 'a' }, muscle: 'chest', builtin: true }],
      settings: { uiLang: 'fr', branding: { coachName: '', instagram: '', accent: '#22D3EE' } },
      programs: [{
        id: 'p', clientId: null, isTemplate: false, title: 't', pdfLang: 'fr', pdfStyle: 'clean', coachNote: '', createdAt: 1, updatedAt: 1,
        weeks: [{ id: 'w', label: 'W', days: [{ id: 'd', name: 'D', focus: '', entries: [{ id: 'e', exerciseId: 'a', sets: 3, reps: '10', restSec: 60, notes: '' }] }] }],
      }],
    }
    const parsed = parseBackup(old)!
    expect(parsed).not.toBeNull()
    expect(parsed.programs[0].weeks[0].days[0].entries[0].measure).toBe('reps')
    expect(parsed.programs[0].showEstimate).toBe(true)
    expect(parsed.exercises[0].measure).toBe('reps')
  })

  it('writes a WhatsApp text with times and supersets', () => {
    const e1 = { ...makeEntry(by('Bench press')), superset: true, load: 'RPE 8' }
    const e2 = makeEntry(by('Plank'))
    const p: Program = {
      id: 'p', clientId: null, isTemplate: false, title: 'Test', pdfLang: 'en', pdfStyle: 'clean', coachNote: 'Drink water',
      showEstimate: true, createdAt: 0, updatedAt: 0,
      weeks: [{ id: 'w', label: 'Week 1', days: [{ id: 'd', name: 'Day 1', focus: 'Push', entries: [e1, e2] }] }],
    }
    const txt = programToText(p, null, ex, { coachName: 'Coach', instagram: 'coach', accent: '#fff' })
    expect(txt).toContain('*Test*')
    expect(txt).toContain('1a. Bench press')
    expect(txt).toContain('1b. Plank : 3x 45 s')
    expect(txt).toContain('RPE 8')
    expect(txt).toContain('@coach')
  })
})
