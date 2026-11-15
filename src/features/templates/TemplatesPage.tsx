import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Empty, Modal, PageHead, confirmIf } from '../../components/ui'
import GenerateModal from '../programs/GenerateModal'
import { addStarterTemplates } from './starter'

export default function TemplatesPage() {
  const { t, lang } = useT()
  const nav = useNavigate()
  const programs = useStore((s) => s.programs)
  const clients = useStore((s) => s.clients)
  const createProgram = useStore((s) => s.createProgram)
  const deleteProgram = useStore((s) => s.deleteProgram)
  const [using, setUsing] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const templates = programs.filter((p) => p.isTemplate)

  return (
    <div>
      <PageHead title={t('templates_title')}>
        <button className="btn" onClick={() => setGenerating(true)}>{t('gen_button')}</button>
        <button
          className="btn btn-primary"
          onClick={() => nav(`/programs/${createProgram({ clientId: null, isTemplate: true })}`)}
        >
          + {t('template_new')}
        </button>
      </PageHead>
      <p className="mb-4 text-sm text-muted">{t('templates_hint')}</p>

      {templates.length === 0 ? (
        <Empty>
          <p>{t('templates_empty')}</p>
          <button className="btn btn-primary mt-4" onClick={() => addStarterTemplates(t, lang)}>{t('starter_templates')}</button>
        </Empty>
      ) : (
        <ul className="grid gap-3">
          {templates.map((p) => (
            <li key={p.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.title}</div>
                  <div className="text-xs text-muted">
                    {t('week')} × {p.weeks.length} / {t('day')} × {p.weeks.reduce((n, w) => n + w.days.length, 0)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn" to={`/programs/${p.id}`}>{t('edit')}</Link>
                  <button className="btn btn-primary" disabled={clients.length === 0} onClick={() => setUsing(p.id)}>
                    {t('use_for_client')}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => confirmIf(t('confirm_delete')) && deleteProgram(p.id)}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {generating && (
        <GenerateModal clientId={null} onClose={() => setGenerating(false)} onCreated={(pid) => nav(`/programs/${pid}`)} />
      )}

      {using && (
        <Modal title={t('choose_client')} onClose={() => setUsing(null)}>
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.id}>
                <button
                  className="btn w-full justify-start"
                  onClick={() => {
                    const pid = createProgram({ clientId: c.id, fromTemplateId: using })
                    setUsing(null)
                    nav(`/programs/${pid}`)
                  }}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  )
}
