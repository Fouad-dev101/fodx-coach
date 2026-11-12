import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { LANGS, useT } from '../../i18n'
import { Field, PageHead, confirmIf } from '../../components/ui'
import { fileToLogo } from '../../lib/image'
import { downloadBlob } from '../../lib/download'
import { parseBackup } from '../../store/schema'
import { isHex } from '../../lib/color'

const PRESETS = ['#22D3EE', '#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EC4899']

export default function SettingsPage() {
  const { t, lang } = useT()
  const settings = useStore((s) => s.settings)
  const setUiLang = useStore((s) => s.setUiLang)
  const updateBranding = useStore((s) => s.updateBranding)
  const exportBackup = useStore((s) => s.exportBackup)
  const importBackup = useStore((s) => s.importBackup)
  const resetAll = useStore((s) => s.resetAll)
  const b = settings.branding
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [persisted, setPersisted] = useState<boolean | null | 'na'>(null)
  const [hex, setHex] = useState(b.accent)

  useEffect(() => setHex(b.accent), [b.accent])
  useEffect(() => {
    if (navigator.storage?.persisted) navigator.storage.persisted().then(setPersisted).catch(() => setPersisted('na'))
    else setPersisted('na')
  }, [])

  const onLogo = async (f?: File) => {
    if (!f) return
    try {
      updateBranding({ logoDataUrl: await fileToLogo(f) })
    } catch {
      setMsg({ ok: false, text: t('import_error') })
    }
  }

  const onImport = async (f?: File) => {
    if (!f) return
    try {
      const data = parseBackup(JSON.parse(await f.text()))
      if (!data) throw new Error('invalid')
      if (!confirmIf(t('import_confirm'))) return
      importBackup(data)
      setMsg({ ok: true, text: t('import_ok') })
    } catch {
      setMsg({ ok: false, text: t('import_error') })
    }
    if (importRef.current) importRef.current.value = ''
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHead title={t('settings_title')} />

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">{t('ui_language')}</h2>
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <button key={l.id} className={`chip ${lang === l.id ? 'chip-on' : ''}`} onClick={() => setUiLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-semibold">{t('branding')}</h2>
          <p className="text-sm text-muted">{t('branding_hint')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('coach_name')}>
            <input className="input" value={b.coachName} onChange={(e) => updateBranding({ coachName: e.target.value })} />
          </Field>
          <Field label={t('instagram')}>
            <input className="input" dir="ltr" placeholder="@fodxtech" value={b.instagram} onChange={(e) => updateBranding({ instagram: e.target.value })} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={b.showQr !== false} onChange={(e) => updateBranding({ showQr: e.target.checked })} />
          {t('show_qr')}
        </label>

        <div>
          <span className="label">{t('accent_color')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                aria-label={c}
                onClick={() => updateBranding({ accent: c })}
                className={`h-9 w-9 rounded-full border-2 ${b.accent.toLowerCase() === c.toLowerCase() ? 'border-white' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
            <input
              className="input w-28"
              dir="ltr"
              value={hex}
              onChange={(e) => {
                setHex(e.target.value)
                if (isHex(e.target.value) && e.target.value.length === 7) updateBranding({ accent: e.target.value })
              }}
            />
          </div>
        </div>

        <div>
          <span className="label">{t('logo')}</span>
          <div className="flex items-center gap-3">
            {b.logoDataUrl ? (
              <img src={b.logoDataUrl} alt="" className="h-14 w-14 rounded-lg border border-line bg-white object-contain p-1" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-lg border border-dashed border-line text-muted">+</div>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
            <button className="btn" onClick={() => fileRef.current?.click()}>{t('upload_logo')}</button>
            {b.logoDataUrl && (
              <button className="btn btn-ghost" onClick={() => updateBranding({ logoDataUrl: undefined })}>{t('remove_logo')}</button>
            )}
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div>
          <h2 className="font-semibold">{t('backup')}</h2>
          <p className="text-sm text-muted">{t('backup_hint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            onClick={() =>
              downloadBlob(
                new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' }),
                `fodx-coach-backup-${new Date().toISOString().slice(0, 10)}.json`,
              )
            }
          >
            {t('export_backup')}
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <button className="btn" onClick={() => importRef.current?.click()}>{t('import_backup')}</button>
        </div>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-400' : 'text-red-300'}`}>{msg.text}</p>}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">{t('storage')}</h2>
        <p className="text-sm text-muted">
          {persisted === 'na' ? t('storage_unsupported') : persisted ? t('storage_persistent') : t('storage_not_persistent')}
        </p>
        {persisted === false && (
          <button className="btn" onClick={() => navigator.storage.persist().then(setPersisted)}>{t('storage_request')}</button>
        )}
      </section>

      <section className="card space-y-3 border-red-500/30 p-5">
        <h2 className="font-semibold">{t('danger_zone')}</h2>
        <button className="btn btn-danger" onClick={() => confirmIf(t('reset_confirm')) && void resetAll()}>{t('reset_all')}</button>
      </section>
    </div>
  )
}
