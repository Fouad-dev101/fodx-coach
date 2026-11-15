import { LANGS, useT } from '../i18n'
import { useStore } from '../store/useStore'

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src={`${import.meta.env.BASE_URL}logo-mark.png`} alt="" style={{ height: size }} className="w-auto" />
      <span className="font-display text-lg font-bold leading-none tracking-tight">
        FODX <span className="text-cyan">Coach</span>
      </span>
    </span>
  )
}

const SHORT: Record<string, string> = { fr: 'FR', ar: 'عر', en: 'EN' }

/** One-tap language switch, always visible (it used to be buried in Settings). */
export function LangSwitch() {
  const { lang } = useT()
  const setUiLang = useStore((s) => s.setUiLang)
  return (
    <div className="flex overflow-hidden rounded-lg border border-line text-xs" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.id}
          aria-label={l.label}
          aria-pressed={lang === l.id}
          className={`px-2.5 py-1.5 ${lang === l.id ? 'bg-cyan text-ink font-semibold' : 'text-muted hover:text-white'}`}
          onClick={() => setUiLang(l.id)}
        >
          {SHORT[l.id]}
        </button>
      ))}
    </div>
  )
}
