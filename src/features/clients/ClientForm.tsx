import { useState } from 'react'
import { useT } from '../../i18n'
import { Field } from '../../components/ui'
import type { Client, Level } from '../../types/model'

export type ClientDraft = Pick<Client, 'name' | 'goal' | 'level' | 'daysPerWeek' | 'notes'>

export const emptyClient: ClientDraft = { name: '', goal: '', level: 'beginner', daysPerWeek: 3, notes: '' }

export default function ClientForm({
  initial, onSubmit, onCancel,
}: { initial: ClientDraft; onSubmit: (c: ClientDraft) => void; onCancel?: () => void }) {
  const { t } = useT()
  const [c, setC] = useState(initial)
  const set = <K extends keyof ClientDraft>(k: K, v: ClientDraft[K]) => setC((p) => ({ ...p, [k]: v }))
  return (
    <div className="space-y-3">
      <Field label={t('client_name')}>
        <input className="input" value={c.name} autoFocus onChange={(e) => set('name', e.target.value)} />
      </Field>
      <Field label={t('client_goal')}>
        <input className="input" value={c.goal} placeholder={t('client_goal_ph')} onChange={(e) => set('goal', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('client_level')}>
          <select className="input" value={c.level} onChange={(e) => set('level', e.target.value as Level)}>
            <option value="beginner">{t('level_beginner')}</option>
            <option value="intermediate">{t('level_intermediate')}</option>
            <option value="advanced">{t('level_advanced')}</option>
          </select>
        </Field>
        <Field label={t('client_days')}>
          <select className="input" value={c.daysPerWeek} onChange={(e) => set('daysPerWeek', Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t('client_notes')}>
        <textarea className="input min-h-24" value={c.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button className="btn" onClick={onCancel}>{t('cancel')}</button>}
        <button className="btn btn-primary" disabled={!c.name.trim()} onClick={() => onSubmit({ ...c, name: c.name.trim() })}>
          {t('save')}
        </button>
      </div>
    </div>
  )
}
