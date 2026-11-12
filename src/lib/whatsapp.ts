import type { Branding, Client, Exercise, Lang, Program } from '../types/model'
import { pdfLabels } from '../pdf/labels'
import { DEFAULT_DAY, DEFAULT_WEEK, durationText, entryLabels } from './format'
import { exName } from './exercise'

/** Plain-text version of a program, formatted with WhatsApp bold/italic. */
export function programToText(p: Program, client: Client | null, exercises: Exercise[], b: Branding): string {
  const lang: Lang = p.pdfLang === 'bilingual' ? 'fr' : p.pdfLang
  const L = pdfLabels[lang]
  const exMap = new Map(exercises.map((e) => [e.id, e]))
  const out: string[] = [`*${p.title}*`]
  if (client) out.push(`${L.client}: ${client.name}${client.goal ? ` | ${client.goal}` : ''}`)
  out.push('')

  p.weeks.forEach((w, wi) => {
    if (p.weeks.length > 1) {
      const wl = w.label.trim()
      out.push(`*== ${wl && !DEFAULT_WEEK.test(wl) ? wl : `${L.week} ${wi + 1}`} ==*`, '')
    }
    w.days.forEach((d, di) => {
      const custom = d.name.trim() && !DEFAULT_DAY.test(d.name.trim()) ? d.name.trim() : ''
      const title = [custom, d.focus.trim()].filter(Boolean).join(' : ')
      out.push(`*${L.day} ${di + 1}${title ? ` - ${title}` : ''}*`)
      const labels = entryLabels(d.entries)
      d.entries.forEach((e, i) => {
        const ex = exMap.get(e.exerciseId)
        const name = ex ? exName(ex, lang) : '?'
        const spec =
          e.measure === 'time'
            ? `${e.sets > 1 ? `${e.sets}x ` : ''}${durationText(e.durationSec ?? 0, lang)}`
            : `${e.sets}x${e.reps || '-'}`
        const parts = [spec]
        if (e.load.trim()) parts.push(e.load.trim())
        if (e.restSec) parts.push(`${L.restWord} ${e.restSec}${lang === 'ar' ? 'ث' : 's'}`)
        out.push(`${labels[i]}. ${name} : ${parts.join(' | ')}`)
        if (e.notes.trim()) out.push(`   _${e.notes.trim()}_`)
      })
      out.push('')
    })
  })

  if (p.coachNote.trim()) out.push(`_${p.coachNote.trim()}_`, '')
  const sig = [b.coachName.trim(), b.instagram.trim() ? `@${b.instagram.trim().replace(/^@/, '')}` : ''].filter(Boolean).join(' ')
  out.push(sig ? `- ${sig} (FODX Coach)` : '- FODX Coach')
  return out.join('\n')
}
