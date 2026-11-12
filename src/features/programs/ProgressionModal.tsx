import { useState } from 'react'
import { useT } from '../../i18n'
import { Field, Modal } from '../../components/ui'
import type { ProgressOpts } from '../../lib/progress'

const nums = (max: number) => Array.from({ length: max + 1 }, (_, i) => i)

/** Auto-progression: turns one good week into a whole block that gets harder over time. */
export default function ProgressionModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (o: ProgressOpts) => void }) {
  const { t } = useT()
  const [o, setO] = useState<ProgressOpts>({ weeks: 3, repsStep: 1, restStep: 0, timeStep: 0, addSetEvery: 0, deload: false })
  const set = <K extends keyof ProgressOpts>(k: K, v: ProgressOpts[K]) => setO((p) => ({ ...p, [k]: v }))
  return (
    <Modal title={t('generate_weeks')} onClose={onClose}>
      <p className="mb-4 text-sm text-muted">{t('gw_hint')}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('gw_count')}>
          <select className="input" value={o.weeks} onChange={(e) => set('weeks', Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t('gw_reps')}>
          <select className="input" value={o.repsStep} onChange={(e) => set('repsStep', Number(e.target.value))}>
            {nums(3).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t('gw_sets')}>
          <select className="input" value={o.addSetEvery} onChange={(e) => set('addSetEvery', Number(e.target.value))}>
            <option value={0}>{t('gw_never')}</option>
            <option value={2}>{t('gw_every', { n: 2 })}</option>
            <option value={3}>{t('gw_every', { n: 3 })}</option>
            <option value={4}>{t('gw_every', { n: 4 })}</option>
          </select>
        </Field>
        <Field label={t('gw_rest')}>
          <select className="input" value={o.restStep} onChange={(e) => set('restStep', Number(e.target.value))}>
            {[0, 5, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t('gw_time')}>
          <select className="input" value={o.timeStep} onChange={(e) => set('timeStep', Number(e.target.value))}>
            {[0, 5, 10, 15, 30, 60].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={o.deload} onChange={(e) => set('deload', e.target.checked)} />
        {t('gw_deload')}
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>{t('cancel')}</button>
        <button className="btn btn-primary" onClick={() => onGenerate(o)}>{t('gw_create')}</button>
      </div>
    </Modal>
  )
}
