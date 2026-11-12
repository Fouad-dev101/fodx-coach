import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Empty, Modal, PageHead } from '../../components/ui'
import ClientForm, { emptyClient } from './ClientForm'

export default function ClientsPage() {
  const { t } = useT()
  const clients = useStore((s) => s.clients)
  const programs = useStore((s) => s.programs)
  const addClient = useStore((s) => s.addClient)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const shown = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())),
    [clients, q],
  )

  return (
    <div>
      <PageHead title={t('clients_title')}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ {t('client_new')}</button>
      </PageHead>

      {clients.length > 3 && (
        <input className="input mb-4" placeholder={t('search_clients')} value={q} onChange={(e) => setQ(e.target.value)} />
      )}

      {clients.length === 0 ? (
        <Empty>{t('clients_empty')}</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((c) => {
            const count = programs.filter((p) => p.clientId === c.id).length
            return (
              <li key={c.id}>
                <Link to={`/clients/${c.id}`} className="card block p-4 transition-colors hover:border-cyan/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-base font-semibold">{c.name}</div>
                    <span className="shrink-0 text-xs text-muted">{t('per_week', { n: c.daysPerWeek })}</span>
                  </div>
                  <div className="mt-1 truncate text-sm text-muted">
                    {[c.goal, t(`level_${c.level}` as 'level_beginner')].filter(Boolean).join(' / ')}
                  </div>
                  <div className="mt-2 text-xs text-cyan">{t('client_programs')}: {count}</div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {open && (
        <Modal title={t('client_new')} onClose={() => setOpen(false)}>
          <ClientForm
            initial={emptyClient}
            onCancel={() => setOpen(false)}
            onSubmit={(c) => {
              addClient(c)
              setOpen(false)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
