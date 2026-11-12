import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { newDay, newWeek, useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Field, Modal, confirmIf } from '../../components/ui'
import { cloneDay, cloneWeek } from '../../lib/clone'
import { exName } from '../../lib/exercise'
import { makeEntry } from '../../lib/entry'
import { DEFAULT_DAY, entryLabels } from '../../lib/format'
import { dayMinutes, volumeByMuscle } from '../../lib/stats'
import { buildProgressionWeeks, type ProgressOpts } from '../../lib/progress'
import ExercisePicker from './ExercisePicker'
import ExportModal from './ExportModal'
import ProgressionModal from './ProgressionModal'
import DurationInput from './DurationInput'
import type { Day, ExerciseEntry, PdfLang, PdfStyle, Week } from '../../types/model'

function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

export default function ProgramBuilder() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, lang } = useT()
  const program = useStore((s) => s.programs.find((p) => p.id === id))
  const clients = useStore((s) => s.clients)
  const exercises = useStore((s) => s.exercises)
  const canUndo = useStore((s) => (id ? (s.history[id]?.length ?? 0) > 0 : false))
  const update = useStore((s) => s.updateProgram)
  const undo = useStore((s) => s.undoProgram)
  const deleteProgram = useStore((s) => s.deleteProgram)
  const duplicateProgram = useStore((s) => s.duplicateProgram)
  const saveAsTemplate = useStore((s) => s.saveAsTemplate)

  const [wi, setWi] = useState(0)
  const [pickerDay, setPickerDay] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [progressing, setProgressing] = useState(false)
  const [tplOpen, setTplOpen] = useState(false)
  const [tplName, setTplName] = useState('')
  const [toast, setToast] = useState('')
  const exMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  // Ctrl/Cmd+Z undoes the program unless you are typing in a field (the browser handles text undo there).
  useEffect(() => {
    if (!id) return
    const onKey = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        ev.preventDefault()
        undo(id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [id, undo])

  if (!program) {
    return (
      <div>
        <Link to="/" className="text-sm text-cyan">← {t('back')}</Link>
        <p className="mt-4 text-muted">{t('program_missing')}</p>
      </div>
    )
  }

  const pid = program.id
  const wIdx = Math.min(wi, program.weeks.length - 1)
  const week = program.weeks[wIdx]
  const back = program.isTemplate ? '/templates' : program.clientId ? `/clients/${program.clientId}` : '/'
  const volume = volumeByMuscle(week, exMap)

  const renumber = (w: Week) =>
    w.days.forEach((d, i) => {
      if (DEFAULT_DAY.test(d.name.trim())) d.name = `${t('day')} ${i + 1}`
    })
  const mutWeek = (fn: (w: Week) => void) =>
    update(pid, (d) => {
      const w = d.weeks.find((x) => x.id === week.id)
      if (w) fn(w)
    })
  const mutDay = (dayId: string, fn: (d: Day, w: Week) => void) =>
    mutWeek((w) => {
      const d = w.days.find((x) => x.id === dayId)
      if (d) fn(d, w)
    })
  const mutEntry = (dayId: string, entryId: string, fn: (e: ExerciseEntry) => void) =>
    mutDay(dayId, (d) => {
      const e = d.entries.find((x) => x.id === entryId)
      if (e) fn(e)
    })

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }
  const num = (v: string) => (v === '' ? 0 : Math.max(0, Math.min(999, parseInt(v, 10) || 0)))

  const setMeasure = (dayId: string, e: ExerciseEntry, m: 'reps' | 'time') =>
    mutEntry(dayId, e.id, (x) => {
      const ex = exMap.get(x.exerciseId)
      x.measure = m
      if (m === 'time') x.durationSec = x.durationSec ?? ex?.defaults?.durationSec ?? 60
      else x.reps = x.reps || ex?.defaults?.reps || '10'
    })

  return (
    <div>
      <Link to={back} className="text-sm text-cyan">← {t('back')}</Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {program.isTemplate && <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs text-cyan">{t('template_badge')}</span>}
        <span className="text-xs text-muted">{t('last_saved')}</span>
        {toast && <span className="text-xs text-green-400">{toast}</span>}
        <button className="btn btn-ghost ms-auto min-h-8 px-3 text-xs" disabled={!canUndo} onClick={() => undo(pid)}>↶ {t('undo')}</button>
      </div>

      <input
        aria-label={t('program_title')}
        className="input mt-2 text-lg font-semibold"
        value={program.title}
        onChange={(e) => update(pid, (d) => void (d.title = e.target.value))}
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label={t('pdf_language')}>
          <select className="input" value={program.pdfLang} onChange={(e) => update(pid, (d) => void (d.pdfLang = e.target.value as PdfLang))}>
            <option value="fr">{t('lang_fr')}</option>
            <option value="ar">{t('lang_ar')}</option>
            <option value="en">{t('lang_en')}</option>
            <option value="bilingual">{t('lang_bilingual')}</option>
          </select>
        </Field>
        <Field label={t('pdf_style')}>
          <select className="input" value={program.pdfStyle} onChange={(e) => update(pid, (d) => void (d.pdfStyle = e.target.value as PdfStyle))}>
            <option value="clean">{t('style_clean')}</option>
            <option value="bold">{t('style_bold')}</option>
            <option value="minimal">{t('style_minimal')}</option>
          </select>
        </Field>
        {!program.isTemplate && (
          <Field label={t('assigned_to')}>
            <select className="input" value={program.clientId ?? ''} onChange={(e) => update(pid, (d) => void (d.clientId = e.target.value || null))}>
              <option value="">{t('no_client')}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={program.showEstimate} onChange={(e) => update(pid, (d) => void (d.showEstimate = e.target.checked))} />
        {t('show_estimate')}
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => setExporting(true)}>{t('export_pdf')}</button>
        {!program.isTemplate && (
          <button className="btn" onClick={() => { setTplName(program.title); setTplOpen(true) }}>{t('save_as_template')}</button>
        )}
        <button className="btn" onClick={() => nav(`/programs/${duplicateProgram(pid)}`)}>{t('duplicate_program')}</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (!confirmIf(t('delete_program_confirm'))) return
            deleteProgram(pid)
            nav(back)
          }}
        >
          {t('delete')}
        </button>
      </div>

      {/* Weeks */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
        {program.weeks.map((w, i) => (
          <button key={w.id} className={`chip shrink-0 ${i === wIdx ? 'chip-on' : ''}`} onClick={() => setWi(i)}>
            {w.label || `${t('week')} ${i + 1}`}
          </button>
        ))}
        <button
          className="chip shrink-0"
          onClick={() => {
            update(pid, (d) => void d.weeks.push(newWeek(`${t('week')} ${d.weeks.length + 1}`, [newDay(`${t('day')} 1`)])))
            setWi(program.weeks.length)
          }}
        >
          + {t('add_week')}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Field label={t('week_label')}>
            <input className="input" value={week.label} onChange={(e) => mutWeek((w) => void (w.label = e.target.value))} />
          </Field>
        </div>
        <button
          className="btn"
          onClick={() => {
            update(pid, (d) => {
              d.weeks.splice(wIdx + 1, 0, cloneWeek(week, `${t('week')} ${d.weeks.length + 1}`))
            })
            setWi(wIdx + 1)
          }}
        >
          {t('duplicate_week')}
        </button>
        <button className="btn" onClick={() => setProgressing(true)}>📈 {t('generate_weeks')}</button>
        {program.weeks.length > 1 && (
          <button
            className="btn btn-danger"
            onClick={() => {
              if (!confirmIf(t('confirm_delete'))) return
              update(pid, (d) => void d.weeks.splice(wIdx, 1))
              setWi(Math.max(0, wIdx - 1))
            }}
          >
            {t('delete_week')}
          </button>
        )}
      </div>

      {volume.length > 0 && (
        <details className="card mt-4 px-4 py-3">
          <summary className="cursor-pointer text-sm text-muted">{t('volume_title')}</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {volume.map(([m, n]) => (
              <span key={m} className="rounded-full border border-line px-3 py-1 text-sm">
                {t(`muscle_${m}` as 'muscle_chest')} <b className="text-cyan">{n}</b>
              </span>
            ))}
          </div>
        </details>
      )}

      {/* Days */}
      <div className="mt-5 space-y-4">
        {week.days.length === 0 && <p className="text-sm text-muted">{t('no_days')}</p>}
        {week.days.map((day, di) => {
          const mins = dayMinutes(day)
          const labels = entryLabels(day.entries)
          return (
            <section key={day.id} className="card p-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-32 flex-1">
                  <Field label={t('day_name')}>
                    <input className="input font-semibold" value={day.name} onChange={(e) => mutDay(day.id, (d) => void (d.name = e.target.value))} />
                  </Field>
                </div>
                <div className="min-w-40 flex-[2]">
                  <Field label={t('day_focus')}>
                    <input className="input" value={day.focus} onChange={(e) => mutDay(day.id, (d) => void (d.focus = e.target.value))} />
                  </Field>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-icon" aria-label={t('move_up')} disabled={di === 0} onClick={() => mutWeek((w) => { move(w.days, di, -1); renumber(w) })}>↑</button>
                  <button className="btn btn-icon" aria-label={t('move_down')} disabled={di === week.days.length - 1} onClick={() => mutWeek((w) => { move(w.days, di, 1); renumber(w) })}>↓</button>
                  <button className="btn btn-icon" aria-label={t('duplicate')} title={t('duplicate')} onClick={() => mutWeek((w) => { w.days.splice(di + 1, 0, cloneDay(day)); renumber(w) })}>⧉</button>
                  <button className="btn btn-icon btn-danger" aria-label={t('delete')} onClick={() => confirmIf(t('confirm_delete')) && mutWeek((w) => { w.days.splice(di, 1); renumber(w) })}>✕</button>
                </div>
              </div>
              {mins > 0 && <p className="mt-2 text-xs text-cyan">{t('estimate', { n: mins })}</p>}

              {day.entries.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{t('no_exercises')}</p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {day.entries.map((en, i) => {
                    const ex = exMap.get(en.exerciseId)
                    const isTime = en.measure === 'time'
                    return (
                      <li key={en.id} className={`rounded-xl border bg-ink p-3 ${/[a-z]$/.test(labels[i]) ? 'border-s-4 border-line border-s-cyan' : 'border-line'}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-7 shrink-0 text-sm font-semibold text-cyan">{labels[i]}</span>
                          <div className="min-w-0 flex-1 truncate font-medium">{ex ? exName(ex, lang) : t('unknown_exercise')}</div>
                          <button className="btn btn-ghost btn-icon" aria-label={t('move_up')} disabled={i === 0} onClick={() => mutDay(day.id, (d) => move(d.entries, i, -1))}>↑</button>
                          <button className="btn btn-ghost btn-icon" aria-label={t('move_down')} disabled={i === day.entries.length - 1} onClick={() => mutDay(day.id, (d) => move(d.entries, i, 1))}>↓</button>
                          <button className="btn btn-ghost btn-icon text-red-300" aria-label={t('delete')} onClick={() => mutDay(day.id, (d) => void d.entries.splice(i, 1))}>✕</button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <div className="flex overflow-hidden rounded-lg border border-line text-xs">
                            <button className={`px-3 py-1.5 ${!isTime ? 'bg-cyan text-ink' : 'text-muted'}`} onClick={() => setMeasure(day.id, en, 'reps')}>{t('measure_reps')}</button>
                            <button className={`px-3 py-1.5 ${isTime ? 'bg-cyan text-ink' : 'text-muted'}`} onClick={() => setMeasure(day.id, en, 'time')}>⏱ {t('measure_time')}</button>
                          </div>
                          <button
                            className={`chip text-xs ${en.superset ? 'chip-on' : ''}`}
                            disabled={i === day.entries.length - 1}
                            aria-pressed={en.superset}
                            onClick={() => mutEntry(day.id, en.id, (x) => void (x.superset = !x.superset))}
                          >
                            ⛓ {t('superset')}
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Field label={t('sets')}>
                            <input className="input" inputMode="numeric" value={en.sets} onChange={(e) => mutEntry(day.id, en.id, (x) => void (x.sets = num(e.target.value)))} />
                          </Field>
                          {isTime ? (
                            <div>
                              <span className="label">{t('duration')}</span>
                              <DurationInput value={en.durationSec} onChange={(v) => mutEntry(day.id, en.id, (x) => void (x.durationSec = v))} />
                            </div>
                          ) : (
                            <Field label={t('reps')}>
                              <input className="input" value={en.reps} placeholder="8-10" onChange={(e) => mutEntry(day.id, en.id, (x) => void (x.reps = e.target.value))} />
                            </Field>
                          )}
                          <Field label={t('rest')}>
                            <input className="input" inputMode="numeric" value={en.restSec ?? ''} onChange={(e) => mutEntry(day.id, en.id, (x) => void (x.restSec = e.target.value === '' ? null : num(e.target.value)))} />
                          </Field>
                          <Field label={t('load')}>
                            <input className="input" value={en.load} placeholder={t('load_ph')} onChange={(e) => mutEntry(day.id, en.id, (x) => void (x.load = e.target.value))} />
                          </Field>
                          <div className="col-span-2 sm:col-span-4">
                            <Field label={t('entry_notes')}>
                              <input className="input" value={en.notes} onChange={(e) => mutEntry(day.id, en.id, (x) => void (x.notes = e.target.value))} />
                            </Field>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}

              <button className="btn mt-3" onClick={() => setPickerDay(day.id)}>+ {t('add_exercise')}</button>
            </section>
          )
        })}
        <button
          className="btn w-full border-dashed"
          onClick={() => mutWeek((w) => void w.days.push(newDay(`${t('day')} ${w.days.length + 1}`)))}
        >
          + {t('add_day')}
        </button>
      </div>

      <div className="mt-6">
        <Field label={t('coach_note')}>
          <textarea className="input min-h-24" value={program.coachNote} onChange={(e) => update(pid, (d) => void (d.coachNote = e.target.value))} />
        </Field>
      </div>

      {pickerDay && (
        <ExercisePicker
          onClose={() => setPickerDay(null)}
          onPick={(exerciseId) =>
            mutDay(pickerDay, (d) => {
              const ex = exMap.get(exerciseId) ?? useStore.getState().exercises.find((x) => x.id === exerciseId)
              if (!ex) return
              const prev = [...d.entries].reverse().find((e) => e.measure === 'reps')
              d.entries.push(makeEntry(ex, prev))
            })
          }
        />
      )}

      {progressing && (
        <ProgressionModal
          onClose={() => setProgressing(false)}
          onGenerate={(o: ProgressOpts) => {
            update(pid, (d) => {
              const added = buildProgressionWeeks(d.weeks[wIdx], d.weeks.length, o, { week: t('week'), deload: t('deload') })
              d.weeks.splice(wIdx + 1, 0, ...added)
            })
            setWi(wIdx + 1)
            setProgressing(false)
          }}
        />
      )}

      {exporting && <ExportModal program={program} onClose={() => setExporting(false)} />}

      {tplOpen && (
        <Modal title={t('save_as_template')} onClose={() => setTplOpen(false)}>
          <Field label={t('template_name_prompt')}>
            <input className="input" autoFocus value={tplName} onChange={(e) => setTplName(e.target.value)} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn" onClick={() => setTplOpen(false)}>{t('cancel')}</button>
            <button
              className="btn btn-primary"
              disabled={!tplName.trim()}
              onClick={() => {
                saveAsTemplate(pid, tplName.trim())
                setTplOpen(false)
                flash(t('template_saved'))
              }}
            >
              {t('save')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
