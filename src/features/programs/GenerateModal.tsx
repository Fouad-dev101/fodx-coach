import { useState } from 'react'
import { useStore, newWeek } from '../../store/useStore'
import { useT } from '../../i18n'
import { Field, Modal } from '../../components/ui'
import { generateDays, type Goal } from '../../lib/generator'
import type { Level } from '../../types/model'

/** One-click program: picks a split from the number of days and fills it from the library. */
export default function GenerateModal({
  clientId, defaults, onClose, onCreated,
}: {
  clientId: string | null
  defaults?: { days: number; level: Level }
  onClose: () => void
  onCreated: (programId: string) => void
}) {
  const { t, lang } = useT()
  const exercises = useStore((s) => s.exercises)
  const createProgram = useStore((s) => s.createProgram)
  const [days, setDays] = useState(defaults?.days ?? 4)
  const [goal, setGoal] = useState<Goal>('muscle')
  const [level, setLevel] = useState<Level>(defaults?.level ?? 'beginner')
  const [warmup, setWarmup] = useState(true)

  const create = () => {
    const list = generateDays({ days, goal, level, warmup, dayLabel: t('day') }, exercises, lang)
    const id = createProgram({
      clientId,
      isTemplate: clientId === null,
      weeks: [newWeek(`${t('week')} 1`, list)],
    })
    onCreated(id)
  }

  return (
    <Modal title={t('gen_title')} onClose={onClose}>
      <p className="mb-4 text-sm text-muted">{t('gen_hint')}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('gen_days')}>
          <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t('gen_goal')}>
          <select className="input" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            <option value="muscle">{t('goal_muscle')}</option>
            <option value="fatloss">{t('goal_fatloss')}</option>
            <option value="strength">{t('goal_strength')}</option>
          </select>
        </Field>
        <Field label={t('client_level')}>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            <option value="beginner">{t('level_beginner')}</option>
            <option value="intermediate">{t('level_intermediate')}</option>
            <option value="advanced">{t('level_advanced')}</option>
          </select>
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={warmup} onChange={(e) => setWarmup(e.target.checked)} />
        {t('gen_warmup')}
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>{t('cancel')}</button>
        <button className="btn btn-primary" onClick={create}>{t('gen_create')}</button>
      </div>
    </Modal>
  )
}
