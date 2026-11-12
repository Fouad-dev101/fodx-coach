import { create } from 'zustand'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type {
  Backup, Client, Day, Exercise, Lang, Muscle, Program, Settings, Week,
} from '../types/model'
import { uid } from '../lib/id'
import { cloneProgram } from '../lib/clone'
import { seedExercises } from '../data/seedExercises'
import { parseBackup } from './schema'
import { translate } from '../i18n/translate'

const DB_KEY = 'fodx-coach-v1'
const lastPush: Record<string, number> = {}

const defaultSettings = (): Settings => ({
  uiLang: 'fr',
  branding: { coachName: '', instagram: '', accent: '#22D3EE', showQr: true },
})

export const newDay = (name: string): Day => ({ id: uid(), name, focus: '', entries: [] })
export const newWeek = (label: string, days: Day[] = []): Week => ({ id: uid(), label, days })

interface Store {
  ready: boolean
  clients: Client[]
  programs: Program[]
  exercises: Exercise[]
  settings: Settings
  history: Record<string, Program[]> // in-memory undo stack, never persisted

  init: () => Promise<void>

  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void

  createProgram: (o: {
    clientId: string | null
    title?: string
    isTemplate?: boolean
    fromTemplateId?: string
    weeks?: Week[]
  }) => string
  updateProgram: (id: string, fn: (draft: Program) => void) => void
  undoProgram: (id: string) => void
  deleteProgram: (id: string) => void
  duplicateProgram: (id: string) => string
  saveAsTemplate: (id: string, title: string) => string

  addExercise: (names: Record<Lang, string>, muscle: Muscle, extra?: Partial<Exercise>) => string
  updateExercise: (id: string, patch: Partial<Exercise>) => void

  setUiLang: (lang: Lang) => void
  updateBranding: (patch: Partial<Settings['branding']>) => void

  exportBackup: () => Backup
  importBackup: (b: Backup) => void
  resetAll: () => Promise<void>
}

export const useStore = create<Store>((set, get) => ({
  ready: false,
  clients: [],
  programs: [],
  exercises: [],
  settings: defaultSettings(),
  history: {},

  init: async () => {
    if (get().ready) return
    let loaded: Backup | null = null
    try {
      const raw = await idbGet(DB_KEY)
      if (raw) {
        loaded = parseBackup(raw)
        // Never destroy data we cannot read: keep a copy before starting fresh.
        if (!loaded) await idbSet(DB_KEY + '-unreadable', raw)
      }
    } catch {
      /* IndexedDB blocked (private mode): run in memory */
    }
    if (loaded) {
      set({
        clients: loaded.clients,
        programs: loaded.programs,
        exercises: loaded.exercises,
        settings: loaded.settings,
        ready: true,
      })
    } else {
      set({ exercises: seedExercises(), ready: true })
    }
  },

  addClient: (data) => {
    const id = uid()
    const now = Date.now()
    set((s) => ({ clients: [{ ...data, id, createdAt: now, updatedAt: now }, ...s.clients] }))
    return id
  },
  updateClient: (id, patch) =>
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)),
    })),
  deleteClient: (id) =>
    set((s) => ({
      clients: s.clients.filter((c) => c.id !== id),
      programs: s.programs.filter((p) => p.clientId !== id),
    })),

  createProgram: ({ clientId, title, isTemplate = false, fromTemplateId, weeks }) => {
    const s = get()
    const lang = s.settings.uiLang
    const client = clientId ? s.clients.find((c) => c.id === clientId) : undefined
    const now = Date.now()
    let program: Program
    const tpl = fromTemplateId ? s.programs.find((p) => p.id === fromTemplateId) : undefined
    if (tpl) {
      program = cloneProgram(tpl, {
        clientId,
        isTemplate: false,
        title: title ?? (client ? translate(lang, 'program_default_title', { name: client.name }) : tpl.title),
      })
    } else {
      const dayLabel = translate(lang, 'day')
      const count = Math.min(7, Math.max(1, client?.daysPerWeek ?? 3))
      const days = Array.from({ length: count }, (_, i) => newDay(`${dayLabel} ${i + 1}`))
      program = {
        id: uid(),
        clientId,
        isTemplate,
        title:
          title ??
          (client
            ? translate(lang, 'program_default_title', { name: client.name })
            : translate(lang, 'untitled_template')),
        pdfLang: lang,
        pdfStyle: 'clean',
        coachNote: '',
        showEstimate: true,
        weeks: weeks ?? [newWeek(`${translate(lang, 'week')} 1`, days)],
        createdAt: now,
        updatedAt: now,
      }
    }
    set((st) => ({ programs: [program, ...st.programs] }))
    return program.id
  },

  updateProgram: (id, fn) =>
    set((s) => {
      const now = Date.now()
      let snapshot: Program | undefined
      const programs = s.programs.map((p) => {
        if (p.id !== id) return p
        snapshot = p
        const draft = structuredClone(p)
        fn(draft)
        draft.updatedAt = now
        return draft
      })
      if (!snapshot) return { programs }
      // Rapid edits (typing) share one undo step.
      const stack = s.history[id] ?? []
      const last = lastPush[id] ?? 0
      lastPush[id] = now
      const history = now - last > 900 ? { ...s.history, [id]: [...stack.slice(-29), snapshot] } : s.history
      return { programs, history }
    }),
  undoProgram: (id) =>
    set((s) => {
      const stack = s.history[id]
      if (!stack?.length) return {}
      const prev = stack[stack.length - 1]
      lastPush[id] = 0
      return {
        programs: s.programs.map((p) => (p.id === id ? prev : p)),
        history: { ...s.history, [id]: stack.slice(0, -1) },
      }
    }),
  deleteProgram: (id) => set((s) => ({ programs: s.programs.filter((p) => p.id !== id) })),
  duplicateProgram: (id) => {
    const src = get().programs.find((p) => p.id === id)
    if (!src) return id
    const copy = cloneProgram(src, { title: `${src.title} (copie)` })
    set((s) => ({ programs: [copy, ...s.programs] }))
    return copy.id
  },
  saveAsTemplate: (id, title) => {
    const src = get().programs.find((p) => p.id === id)
    if (!src) return id
    const tpl = cloneProgram(src, { clientId: null, isTemplate: true, title })
    set((s) => ({ programs: [tpl, ...s.programs] }))
    return tpl.id
  },

  addExercise: (names, muscle, extra) => {
    const id = uid()
    set((s) => ({
      exercises: [...s.exercises, { id, names, muscle, builtin: false, measure: 'reps', ...extra }],
    }))
    return id
  },
  updateExercise: (id, patch) =>
    set((s) => ({ exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

  setUiLang: (uiLang) => set((s) => ({ settings: { ...s.settings, uiLang } })),
  updateBranding: (patch) =>
    set((s) => ({ settings: { ...s.settings, branding: { ...s.settings.branding, ...patch } } })),

  exportBackup: () => {
    const s = get()
    return {
      schemaVersion: 1,
      exportedAt: Date.now(),
      clients: s.clients,
      programs: s.programs,
      exercises: s.exercises,
      settings: s.settings,
    }
  },
  importBackup: (b) =>
    set({ clients: b.clients, programs: b.programs, exercises: b.exercises, settings: b.settings, history: {} }),
  resetAll: async () => {
    try {
      await idbDel(DB_KEY)
    } catch {
      /* ignore */
    }
    set({ clients: [], programs: [], exercises: seedExercises(), settings: defaultSettings(), history: {} })
  },
}))

/** Write-through persistence: debounce so typing does not hammer IndexedDB. */
let timer: ReturnType<typeof setTimeout> | undefined
function persist() {
  const { ready, exportBackup } = useStore.getState()
  if (!ready) return
  idbSet(DB_KEY, exportBackup()).catch(() => {
    /* private mode or quota: backups still work */
  })
}
useStore.subscribe(() => {
  clearTimeout(timer)
  timer = setTimeout(persist, 400)
})
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearTimeout(timer)
      persist()
    }
  })
}
