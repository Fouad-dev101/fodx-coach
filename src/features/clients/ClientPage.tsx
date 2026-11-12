import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Empty, Modal, confirmIf } from '../../components/ui'
import ClientForm from './ClientForm'
import GenerateModal from '../programs/GenerateModal'

export default function ClientPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t } = useT()
  const client = useStore((s) => s.clients.find((c) => c.id === id))
  const programs = useStore((s) => s.programs)
  const updateClient = useStore((s) => s.updateClient)
  const deleteClient = useStore((s) => s.deleteClient)
  const createProgram = useStore((s) => s.createProgram)
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)

  if (!client) {
    return (
      <div>
        <Link to="/" className="text-sm text-cyan">← {t('back')}</Link>
        <p className="mt-4 text-muted">{t('client_missing')}</p>
      </div>
    )
  }

  const mine = programs.filter((p) => p.clientId === client.id && !p.isTemplate)
  const templates = programs.filter((p) => p.isTemplate)

  const start = (fromTemplateId?: string) => {
    const pid = createProgram({ clientId: client.id, fromTemplateId })
    setCreating(false)
    nav(`/programs/${pid}`)
  }

  return (
    <div>
      <Link to="/" className="text-sm text-cyan">← {t('nav_clients')}</Link>

      <div className="card mt-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {[client.goal, t(`level_${client.level}` as 'level_beginner'), t('per_week', { n: client.daysPerWeek })]
                .filter(Boolean)
                .join(' / ')}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setEditing(true)}>{t('edit')}</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirmIf(t('delete_client_confirm'))) {
                  deleteClient(client.id)
                  nav('/')
                }
              }}
            >
              {t('delete')}
            </button>
          </div>
        </div>
        {client.notes.trim() && <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{client.notes}</p>}
      </div>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('client_programs')}</h2>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ {t('program_new')}</button>
      </div>

      {mine.length === 0 ? (
        <Empty>{t('no_programs')}</Empty>
      ) : (
        <ul className="grid gap-3">
          {mine.map((p) => (
            <li key={p.id}>
              <Link to={`/programs/${p.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-cyan/50">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.title}</div>
                  <div className="text-xs text-muted">
                    {t('week')} × {p.weeks.length} / {new Date(p.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="text-cyan">{t('open')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal title={t('client_edit')} onClose={() => setEditing(false)}>
          <ClientForm
            initial={client}
            onCancel={() => setEditing(false)}
            onSubmit={(c) => {
              updateClient(client.id, c)
              setEditing(false)
            }}
          />
        </Modal>
      )}

      {generating && (
        <GenerateModal
          clientId={client.id}
          defaults={{ days: client.daysPerWeek, level: client.level }}
          onClose={() => setGenerating(false)}
          onCreated={(pid) => nav(`/programs/${pid}`)}
        />
      )}

      {creating && (
        <Modal title={t('program_new')} onClose={() => setCreating(false)}>
          <button className="btn btn-primary w-full" onClick={() => { setCreating(false); setGenerating(true) }}>✨ {t('gen_button')}</button>
          <button className="btn mt-2 w-full" onClick={() => start()}>{t('from_blank')}</button>
          <h3 className="mb-2 mt-5 text-sm font-semibold text-muted">{t('from_template')}</h3>
          {templates.length === 0 ? (
            <p className="text-sm text-muted">{t('no_templates_yet')}</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((tp) => (
                <li key={tp.id}>
                  <button className="btn w-full justify-between" onClick={() => start(tp.id)}>
                    <span className="truncate">{tp.title}</span>
                    <span className="text-xs text-muted">{tp.weeks[0]?.days.length ?? 0} {t('day')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}
