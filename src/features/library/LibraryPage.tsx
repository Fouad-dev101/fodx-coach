import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Empty, Field, Modal, PageHead } from '../../components/ui'
import { MUSCLES, type Exercise, type Measure, type Muscle } from '../../types/model'
import { exName } from '../../lib/exercise'
import DurationInput from '../programs/DurationInput'

interface Draft {
  names: Exercise['names']
  muscle: Muscle
  measure: Measure
  sets: number
  reps: string
  durationSec: number
  restSec: number | null
}
const blank: Draft = { names: { fr: '', ar: '', en: '' }, muscle: 'chest', measure: 'reps', sets: 3, reps: '10-12', durationSec: 60, restSec: 60 }
const toDraft = (e: Exercise): Draft => ({
  names: e.names,
  muscle: e.muscle,
  measure: e.measure,
  sets: e.defaults?.sets ?? (e.measure === 'time' ? 1 : 3),
  reps: e.defaults?.reps || '10-12',
  durationSec: e.defaults?.durationSec ?? 60,
  restSec: e.defaults ? e.defaults.restSec : e.measure === 'time' ? null : 60,
})

export default function LibraryPage() {
  const { t, lang } = useT()
  const exercises = useStore((s) => s.exercises)
  const addExercise = useStore((s) => s.addExercise)
  const updateExercise = useStore((s) => s.updateExercise)
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all')
  const [archived, setArchived] = useState(false)
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null)

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return exercises
      .filter((e) => (archived ? true : !e.archived))
      .filter((e) => muscle === 'all' || e.muscle === muscle)
      .filter((e) => !s || Object.values(e.names).some((n) => n.toLowerCase().includes(s)))
      .sort((a, b) => exName(a, lang).localeCompare(exName(b, lang), lang))
  }, [exercises, q, muscle, archived, lang])

  const save = () => {
    if (!editing) return
    const { id, draft: d } = editing
    const fill = d.names.fr.trim() || d.names.en.trim() || d.names.ar.trim()
    if (!fill) return
    const names = { fr: d.names.fr.trim() || fill, en: d.names.en.trim() || fill, ar: d.names.ar.trim() || fill }
    const defaults = {
      sets: Math.max(1, d.sets),
      reps: d.measure === 'reps' ? d.reps : '',
      durationSec: d.measure === 'time' ? d.durationSec : null,
      restSec: d.restSec,
    }
    if (id) updateExercise(id, { names, muscle: d.muscle, measure: d.measure, defaults })
    else addExercise(names, d.muscle, { measure: d.measure, defaults })
    setEditing(null)
  }

  const patch = (p: Partial<Draft>) => editing && setEditing({ ...editing, draft: { ...editing.draft, ...p } })
  const d = editing?.draft

  return (
    <div>
      <PageHead title={t('library_title')}>
        <button className="btn btn-primary" onClick={() => setEditing({ id: null, draft: blank })}>+ {t('exercise_new')}</button>
      </PageHead>

      <input className="input mb-3" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mb-3 flex flex-wrap gap-2">
        <button className={`chip ${muscle === 'all' ? 'chip-on' : ''}`} onClick={() => setMuscle('all')}>{t('all_muscles')}</button>
        {MUSCLES.map((m) => (
          <button key={m} className={`chip ${muscle === m ? 'chip-on' : ''}`} onClick={() => setMuscle(m)}>
            {t(`muscle_${m}` as 'muscle_chest')}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>{t('exercise_count', { n: shown.length })}</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          {t('show_archived')}
        </label>
      </div>

      {shown.length === 0 ? (
        <Empty>{t('no_results')}</Empty>
      ) : (
        <ul className="grid gap-2">
          {shown.map((e) => (
            <li key={e.id} className={`card flex items-center justify-between gap-3 p-3 ${e.archived ? 'opacity-50' : ''}`}>
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {exName(e, lang)} {e.measure === 'time' && <span title={t('timed')} className="text-cyan">⏱</span>}
                </div>
                <div className="truncate text-xs text-muted">
                  {t(`muscle_${e.muscle}` as 'muscle_chest')} / {e.names.fr} / <span dir="rtl">{e.names.ar}</span> / {e.names.en}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn" onClick={() => setEditing({ id: e.id, draft: toDraft(e) })}>{t('edit')}</button>
                <button className="btn btn-ghost" onClick={() => updateExercise(e.id, { archived: !e.archived })}>
                  {e.archived ? t('restore') : t('archive')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && d && (
        <Modal title={editing.id ? t('exercise_edit') : t('exercise_new')} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label={t('name_fr')}>
              <input className="input" value={d.names.fr} onChange={(e) => patch({ names: { ...d.names, fr: e.target.value } })} />
            </Field>
            <Field label={t('name_ar')}>
              <input className="input" dir="rtl" value={d.names.ar} onChange={(e) => patch({ names: { ...d.names, ar: e.target.value } })} />
            </Field>
            <Field label={t('name_en')}>
              <input className="input" value={d.names.en} onChange={(e) => patch({ names: { ...d.names, en: e.target.value } })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('muscle')}>
                <select className="input" value={d.muscle} onChange={(e) => patch({ muscle: e.target.value as Muscle })}>
                  {MUSCLES.map((m) => <option key={m} value={m}>{t(`muscle_${m}` as 'muscle_chest')}</option>)}
                </select>
              </Field>
              <Field label={t('measure_label')}>
                <select className="input" value={d.measure} onChange={(e) => patch({ measure: e.target.value as Measure })}>
                  <option value="reps">{t('measure_reps')}</option>
                  <option value="time">{t('measure_time')}</option>
                </select>
              </Field>
            </div>
            <div>
              <span className="label">{t('default_values')}</span>
              <div className="grid grid-cols-3 gap-2">
                <Field label={t('default_sets')}>
                  <input className="input" inputMode="numeric" value={d.sets} onChange={(e) => patch({ sets: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                </Field>
                {d.measure === 'reps' ? (
                  <Field label={t('default_reps')}>
                    <input className="input" value={d.reps} onChange={(e) => patch({ reps: e.target.value })} />
                  </Field>
                ) : (
                  <div>
                    <span className="label">{t('duration')}</span>
                    <DurationInput value={d.durationSec} onChange={(v) => patch({ durationSec: v })} />
                  </div>
                )}
                <Field label={t('default_rest')}>
                  <input className="input" inputMode="numeric" value={d.restSec ?? ''} onChange={(e) => patch({ restSec: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn" onClick={() => setEditing(null)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={save}>{t('save')}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
