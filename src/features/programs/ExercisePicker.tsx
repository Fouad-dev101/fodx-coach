import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Modal } from '../../components/ui'
import { MUSCLES, type Muscle } from '../../types/model'
import { exName } from '../../lib/exercise'

export default function ExercisePicker({ onPick, onClose }: { onPick: (exerciseId: string) => void; onClose: () => void }) {
  const { t, lang } = useT()
  const exercises = useStore((s) => s.exercises)
  const addExercise = useStore((s) => s.addExercise)
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all')
  const [added, setAdded] = useState(0)
  const [timed, setTimed] = useState(false)

  const query = q.trim()
  const list = useMemo(() => {
    const s = query.toLowerCase()
    return exercises
      .filter((e) => !e.archived)
      .filter((e) => muscle === 'all' || e.muscle === muscle)
      .filter((e) => !s || Object.values(e.names).some((n) => n.toLowerCase().includes(s)))
      .sort((a, b) => exName(a, lang).localeCompare(exName(b, lang), lang))
      .slice(0, 60)
  }, [exercises, query, muscle, lang])

  const exact = exercises.some((e) => !e.archived && Object.values(e.names).some((n) => n.toLowerCase() === query.toLowerCase()))

  const pick = (id: string) => {
    onPick(id)
    setAdded((n) => n + 1)
  }

  return (
    <Modal title={t('picker_title')} onClose={onClose} wide>
      <input className="input mb-3" autoFocus placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <button className={`chip shrink-0 ${muscle === 'all' ? 'chip-on' : ''}`} onClick={() => setMuscle('all')}>{t('all_muscles')}</button>
        {MUSCLES.map((m) => (
          <button key={m} className={`chip shrink-0 ${muscle === m ? 'chip-on' : ''}`} onClick={() => setMuscle(m)}>
            {t(`muscle_${m}` as 'muscle_chest')}
          </button>
        ))}
      </div>

      {query && !exact && (
        <div className="mb-3 space-y-2">
          <button
            className="btn btn-primary w-full"
            onClick={() =>
              pick(
                addExercise(
                  { fr: query, ar: query, en: query },
                  muscle === 'all' ? 'fullbody' : muscle,
                  timed ? { measure: 'time', defaults: { sets: 1, reps: '', durationSec: 60, restSec: null } } : undefined,
                ),
              )
            }
          >
            + {t('create_and_add', { name: query })}
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            ⏱ {t('timed')}
          </label>
        </div>
      )}

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t('no_results')}</p>
      ) : (
        <ul className="grid gap-1.5">
          {list.map((e) => (
            <li key={e.id}>
              <button className="btn w-full justify-between text-start" onClick={() => pick(e.id)}>
                <span className="truncate">{exName(e, lang)} {e.measure === 'time' && <span className="text-cyan">⏱</span>}</span>
                <span className="shrink-0 text-xs text-muted">{t(`muscle_${e.muscle}` as 'muscle_chest')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex items-center justify-between border-t border-line bg-panel px-5 py-3">
        <span className="text-sm text-cyan">{added > 0 ? t('added_count', { n: added }) : ''}</span>
        <button className="btn btn-primary" onClick={onClose}>{t('done')}</button>
      </div>
    </Modal>
  )
}
