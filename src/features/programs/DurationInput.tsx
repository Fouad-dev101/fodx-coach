import { useState } from 'react'
import { useT } from '../../i18n'

/** Number + unit (s / min). Stores seconds. The unit is local so typing "60" never jumps to "1 min". */
export default function DurationInput({ value, onChange }: { value: number | null; onChange: (sec: number) => void }) {
  const { t } = useT()
  const [unit, setUnit] = useState<'s' | 'min'>(value && value >= 60 && value % 60 === 0 ? 'min' : 's')
  const mult = unit === 'min' ? 60 : 1
  const shown = value == null ? '' : String(Math.round((value / mult) * 10) / 10)
  return (
    <div className="flex gap-1.5">
      <input
        className="input min-w-0"
        inputMode="decimal"
        value={shown}
        onChange={(e) => {
          const n = parseFloat(e.target.value.replace(',', '.'))
          onChange(Number.isFinite(n) ? Math.max(0, Math.min(36000, Math.round(n * mult))) : 0)
        }}
      />
      <select className="input w-[5.5rem] shrink-0 px-2" value={unit} onChange={(e) => setUnit(e.target.value as 's' | 'min')}>
        <option value="s">{t('unit_s')}</option>
        <option value="min">{t('unit_min')}</option>
      </select>
    </div>
  )
}
