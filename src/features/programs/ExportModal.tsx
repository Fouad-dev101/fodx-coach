import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n'
import { Modal } from '../../components/ui'
import { downloadBlob, safeFilename } from '../../lib/download'
import { programToText } from '../../lib/whatsapp'
import type { Program } from '../../types/model'

export default function ExportModal({ program, onClose }: { program: Program; onClose: () => void }) {
  const { t } = useT()
  const exercises = useStore((s) => s.exercises)
  const branding = useStore((s) => s.settings.branding)
  const client = useStore((s) => s.clients.find((c) => c.id === program.clientId) ?? null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const text = useMemo(() => programToText(program, client, exercises, branding), [program, client, exercises, branding])

  const filename = useMemo(
    () => `${safeFilename(client ? `${client.name}-${program.title}` : program.title)}-${new Date().toISOString().slice(0, 10)}.pdf`,
    [client, program.title],
  )

  useEffect(() => {
    let alive = true
    let objectUrl: string | null = null
    ;(async () => {
      try {
        // PDF engine is a separate chunk: only downloaded when someone exports.
        const { renderProgramPdf } = await import('../../pdf/render')
        const b = await renderProgramPdf({ program, client, exercises, branding })
        if (!alive) return
        objectUrl = URL.createObjectURL(b)
        setBlob(b)
        setUrl(objectUrl)
        setState('ready')
      } catch (err) {
        console.error(err)
        if (alive) setState('error')
      }
    })()
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // Generate once per open: the modal is remounted for each export.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const file = blob ? new File([blob], filename, { type: 'application/pdf' }) : null
  const canShare = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  return (
    <Modal title={t('export_title')} onClose={onClose} wide>
      {state === 'loading' && <p className="py-10 text-center text-muted">{t('generating')}</p>}
      {state === 'error' && <p className="py-6 text-center text-red-300">{t('export_error')}</p>}
      {state !== 'ready' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn" onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}>{copied ? t('copied') : t('copy_text')}</button>
        </div>
      )}
      {state === 'ready' && blob && url && (
        <div className="space-y-4">
          <p className="text-sm text-green-400">{t('export_ready')}</p>
          {!branding.coachName.trim() && (
            <p className="text-sm text-muted">
              <Link to="/settings" className="text-cyan underline" onClick={onClose}>{t('branding')}</Link>: {t('branding_hint')}
            </p>
          )}
          <iframe title="PDF preview" src={url} className="hidden h-[55dvh] w-full rounded-xl border border-line bg-white md:block" />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => downloadBlob(blob, filename)}>{t('download')}</button>
            {canShare && file && (
              <button
                className="btn"
                onClick={() => navigator.share({ files: [file], title: program.title }).catch(() => undefined)}
              >
                {t('share')}
              </button>
            )}
          </div>
          <div className="border-t border-line pt-3">
            <span className="label">{t('text_version')}</span>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn"
                onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}
              >
                {copied ? t('copied') : t('copy_text')}
              </button>
              <a className="btn" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>
                {t('send_whatsapp')}
              </a>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
