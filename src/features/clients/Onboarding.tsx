import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useT, type Key } from '../../i18n'
import { IconCheck } from '../../components/Icons'
import { addStarterTemplates } from '../templates/starter'

/** First-run checklist: brand, first client, first program, starter templates. Disappears when the basics are done. */
export default function Onboarding({ onAddClient }: { onAddClient: () => void }) {
  const { t, lang } = useT()
  const nav = useNavigate()
  const branding = useStore((s) => s.settings.branding)
  const clients = useStore((s) => s.clients)
  const programs = useStore((s) => s.programs)

  const hasBrand = !!branding.coachName.trim() && !!branding.instagram.trim()
  const hasClient = clients.length > 0
  const hasProgram = programs.some((p) => !p.isTemplate)
  const hasTemplates = programs.some((p) => p.isTemplate)
  if (hasBrand && hasClient && hasProgram) return null

  const steps: { key: Key; done: boolean; go: () => void }[] = [
    { key: 'onb_brand', done: hasBrand, go: () => nav('/settings') },
    { key: 'onb_client', done: hasClient, go: onAddClient },
    { key: 'onb_program', done: hasProgram, go: () => (hasClient ? nav(`/clients/${clients[0].id}`) : onAddClient()) },
    { key: 'onb_templates', done: hasTemplates, go: () => addStarterTemplates(t, lang) },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <section className="card mb-5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{t('onb_title')}</h2>
        <span className="text-xs text-muted">{doneCount}/{steps.length}</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink">
        <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${s.done ? 'border-cyan bg-cyan text-ink' : 'border-line text-transparent'}`}>
              <IconCheck className="h-3.5 w-3.5" />
            </span>
            <span className={`min-w-0 flex-1 text-sm ${s.done ? 'text-muted line-through' : ''}`}>{t(s.key)}</span>
            {!s.done && <button className="btn min-h-8 px-3 py-1 text-xs" onClick={s.go}>{t('onb_go')}</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
