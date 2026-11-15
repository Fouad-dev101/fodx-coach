import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useHtmlLang, useT, type Key } from '../i18n'
import { Logo, LangSwitch } from '../components/Brand'
import { InstallButton } from '../components/Install'
import { IconClipboard, IconDumbbell, IconSliders, IconUsers } from '../components/Icons'
import ClientsPage from '../features/clients/ClientsPage'
import ClientPage from '../features/clients/ClientPage'
import ProgramBuilder from '../features/programs/ProgramBuilder'
import TemplatesPage from '../features/templates/TemplatesPage'
import LibraryPage from '../features/library/LibraryPage'
import SettingsPage from '../features/settings/SettingsPage'

const NAV: { to: string; key: Key; Icon: (p: { className?: string }) => JSX.Element }[] = [
  { to: '/', key: 'nav_clients', Icon: IconUsers },
  { to: '/templates', key: 'nav_templates', Icon: IconClipboard },
  { to: '/library', key: 'nav_library', Icon: IconDumbbell },
  { to: '/settings', key: 'nav_settings', Icon: IconSliders },
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
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-cyan/10 text-cyan' : 'text-muted hover:bg-panel hover:text-white'}`

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-e border-line p-4 md:flex">
        <div className="mb-6 px-2">
          <Logo />
          <div className="mt-1 text-xs text-muted">{t('app_tagline')}</div>
        </div>
        {NAV.map(({ to, key, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={link}>
            <Icon className="h-5 w-5" />
            {t(key)}
          </NavLink>
        ))}
        <div className="mt-auto space-y-3 pt-6">
          <InstallButton className="btn w-full" />
          <LangSwitch />
        </div>
      </aside>

      <header className="flex items-center justify-between gap-2 px-4 pb-1 pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
        <Logo size={30} />
        <LangSwitch />
      </header>

      <main className="min-w-0 flex-1 px-4 pb-32 pt-4 md:px-8 md:pb-10 md:pt-5">
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
        {NAV.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'text-cyan' : 'text-muted'}`}
          >
            <Icon className="h-5 w-5" />
            {t(key)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
