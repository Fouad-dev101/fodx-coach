import { useState } from 'react'
import { useT } from '../i18n'
import { useInstall } from '../lib/install'
import { Modal } from './ui'
import { IconDownload } from './Icons'

/** Native install prompt when the browser allows it, step-by-step help otherwise (iPhone never allows it). */
export function InstallButton({ className = 'btn' }: { className?: string }) {
  const { t } = useT()
  const inst = useInstall()
  const [help, setHelp] = useState(false)
  if (inst.installed) return null
  return (
    <>
      <button
        className={className}
        onClick={() => {
          if (inst.canPrompt) void inst.prompt()
          else setHelp(true)
        }}
      >
        <IconDownload className="h-4 w-4" /> {t('install_app')}
      </button>
      {help && (
        <Modal title={t('install_title')} onClose={() => setHelp(false)}>
          <p className="text-sm leading-relaxed">{inst.ios ? t('install_ios') : t('install_android')}</p>
          <div className="mt-5 flex justify-end">
            <button className="btn btn-primary" onClick={() => setHelp(false)}>{t('done')}</button>
          </div>
        </Modal>
      )}
    </>
  )
}

const KEY = 'fodx-install-dismissed'
const wasDismissed = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function InstallBanner() {
  const { t } = useT()
  const inst = useInstall()
  const [hidden, setHidden] = useState(wasDismissed)
  if (inst.installed || hidden) return null
  return (
    <div className="card mb-5 flex flex-wrap items-center gap-3 border-cyan/30 bg-cyan/5 p-4">
      <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className="h-12 w-12 rounded-xl" />
      <p className="min-w-48 flex-1 text-sm">{t('install_banner')}</p>
      <InstallButton className="btn btn-primary" />
      <button
        className="btn btn-ghost"
        onClick={() => {
          try {
            localStorage.setItem(KEY, '1')
          } catch {
            /* ignore */
          }
          setHidden(true)
        }}
      >
        {t('later')}
      </button>
    </div>
  )
}
