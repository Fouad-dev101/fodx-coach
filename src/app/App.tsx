import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useHtmlLang, useT, type Key } from '../i18n'
import ClientsPage from '../features/clients/ClientsPage'
import ClientPage from '../features/clients/ClientPage'
import ProgramBuilder from '../features/programs/ProgramBuilder'
import TemplatesPage from '../features/templates/TemplatesPage'
import LibraryPage from '../features/library/LibraryPage'
import SettingsPage from '../features/settings/SettingsPage'

const NAV: { to: string; key: Key; icon: string }[] = [
  { to: '/', key: 'nav_clients', icon: '👥' },
  { to: '/templates', key: 'nav_templates', icon: '📋' },
  { to: '/library', key: 'nav_library', icon: '🏋️' },
  { to: '/settings', key: 'nav_settings', icon: '⚙️' },
]

export default function App() {
  const ready = useStore((s) => s.ready)
  const init = useStore((s) => s.init)
  const { t } = useT()
  useHtmlLang()
  useEffect(() => {
    void init()
  }, [init])

  if (!ready) {
    return <div className="grid h-full place-items-center text-muted">{t('loading')}</div>
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-cyan/10 text-cyan' : 'text-muted hover:bg-panel hover:text-white'}`

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-e border-line p-4 md:flex">
        <div className="mb-6 px-2">
          <div className="font-display text-xl font-bold tracking-tight">
            FODX <span className="text-cyan">Coach</span>
          </div>
          <div className="text-xs text-muted">{t('app_tagline')}</div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={link}>
            <span aria-hidden>{n.icon}</span>
            {t(n.key)}
          </NavLink>
        ))}
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10">
        <div className="mb-4 font-display text-lg font-bold md:hidden">
          FODX <span className="text-cyan">Coach</span>
        </div>
        <Routes>
          <Route path="/" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientPage />} />
          <Route path="/programs/:id" element={<ProgramBuilder />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'text-cyan' : 'text-muted'}`
            }
          >
            <span aria-hidden className="text-lg">{n.icon}</span>
            {t(n.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
