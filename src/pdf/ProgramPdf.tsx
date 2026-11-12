import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Branding, Client, Day, Exercise, ExerciseEntry, Lang, Program, Week } from '../types/model'
import { pdfLabels } from './labels'
import { NAVY, accentText, luminance, mix, onColor } from '../lib/color'
import { DEFAULT_DAY, DEFAULT_WEEK, UNITS, entryLabels, splitDuration } from '../lib/format'
import { dayMinutes } from '../lib/stats'

interface Props {
  program: Program
  client?: Client | null
  exercises: Exercise[]
  branding: Branding
  qrDataUrl?: string
}

const MUTED = '#5B6B88'
const LINE = '#D5DEEA'

export default function ProgramPdf({ program, client, exercises, branding, qrDataUrl }: Props) {
  const bilingual = program.pdfLang === 'bilingual'
  const primary: Lang = bilingual ? 'fr' : (program.pdfLang as Lang)
  const secondary: Lang | null = bilingual ? 'ar' : null
  const rtl = primary === 'ar'
  const L = pdfLabels[primary]
  const L2 = secondary ? pdfLabels[secondary] : null
  const variant = program.pdfStyle

  const accent = /^#[0-9a-f]{6}$/i.test(branding.accent) ? branding.accent : '#22D3EE'
  const accentOnPaper = accentText(accent)
  const accentOnDark = luminance(accent) < 0.2 ? mix(accent, '#FFFFFF', 0.55) : accent

  const exMap = new Map(exercises.map((e) => [e.id, e]))
  const row = rtl ? 'row-reverse' : 'row'
  const align = rtl ? 'right' : 'left'
  const handle = branding.instagram.trim().replace(/^@/, '')
  const coach = branding.coachName.trim()
  const initials = (coach || 'FC').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const hasLoad = program.weeks.some((w) => w.days.some((d) => d.entries.some((e) => e.load.trim())))

  const s = StyleSheet.create({
    page: { fontFamily: 'Plex', fontSize: 10, color: NAVY, paddingTop: 36, paddingBottom: 58, paddingHorizontal: 36 },
    bar: { height: 6, backgroundColor: accent, marginTop: -36, marginHorizontal: -36, marginBottom: 22 },
    band: { backgroundColor: NAVY, marginTop: -36, marginHorizontal: -36, paddingHorizontal: 36, paddingTop: 30, paddingBottom: 22, marginBottom: 18 },
    head: { flexDirection: row, justifyContent: 'space-between', alignItems: 'center' },
    brand: { flexDirection: row, alignItems: 'center' },
    logo: { width: 40, height: 40, objectFit: 'contain' },
    initialsBox: { width: 40, height: 40, backgroundColor: variant === 'bold' ? accent : NAVY, alignItems: 'center', justifyContent: 'center' },
    brandText: { marginLeft: rtl ? 0 : 10, marginRight: rtl ? 10 : 0 },
    titleBox: { maxWidth: 260 },
    strip: { flexDirection: row, flexWrap: 'wrap', backgroundColor: '#F1F6FB', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 14 },
    stripItem: { flexDirection: row, marginRight: rtl ? 0 : 16, marginLeft: rtl ? 16 : 0, marginVertical: 1 },
    th: { flexDirection: row, borderBottomWidth: 1, borderBottomColor: variant === 'minimal' ? LINE : NAVY, paddingBottom: 4, marginTop: 4, backgroundColor: variant === 'bold' ? '#EAF0F7' : undefined, paddingTop: variant === 'bold' ? 4 : 0 },
    tr: { flexDirection: row, borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 6, alignItems: 'center' },
    cIdx: { width: 28, paddingHorizontal: 3, color: accentOnPaper, fontWeight: 600 },
    cName: { flexGrow: 1, flexBasis: 0, paddingHorizontal: 4 },
    cNum: { width: 44, textAlign: 'center' },
    cRest: { width: 50, textAlign: 'center' },
    cLoad: { width: 62, textAlign: 'center' },
    note: { marginTop: 18, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F1F6FB', borderLeftWidth: rtl ? 0 : 3, borderRightWidth: rtl ? 3 : 0, borderLeftColor: accent, borderRightColor: accent },
    footer: { position: 'absolute', left: 36, right: 36, bottom: 22, flexDirection: row, justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 6 },
  })

  const colRepsW = (d: Day) => (d.entries.some((e) => e.measure === 'time') && d.entries.some((e) => e.measure === 'reps') ? 78 : 58)
  const repsHead = (d: Day) => {
    const t = d.entries.some((e) => e.measure === 'time')
    const r = d.entries.some((e) => e.measure === 'reps')
    return t && r ? 'repsTime' : t ? 'time' : 'reps'
  }

  const inline = (value: string, unit: string, color?: string) => (
    <View style={{ flexDirection: row, justifyContent: 'center' }}>
      <Text style={{ color }}>{value}</Text>
      <Text style={{ color: MUTED, marginHorizontal: 2 }}>{unit}</Text>
    </View>
  )

  const dayHead = (day: Day, i: number) => {
    const custom = day.name.trim() && !DEFAULT_DAY.test(day.name.trim()) ? day.name.trim() : ''
    const title = [custom, day.focus.trim()].filter(Boolean).join(' : ')
    const badgeBg = variant === 'minimal' ? undefined : accent
    const badgeColor = variant === 'minimal' ? accentOnPaper : onColor(accent)
    const mins = program.showEstimate ? dayMinutes(day) : 0
    const dark = variant === 'bold'
    return (
      <View
        minPresenceAhead={70}
        style={{
          flexDirection: row, alignItems: 'center', marginTop: 16, marginBottom: 4,
          backgroundColor: dark ? NAVY : undefined,
          paddingVertical: dark ? 6 : 0, paddingHorizontal: dark ? 8 : 0,
          borderBottomWidth: variant === 'minimal' ? 0.75 : 0, borderBottomColor: NAVY, paddingBottom: variant === 'minimal' ? 4 : undefined,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: 700, backgroundColor: badgeBg, color: dark ? onColor(accent) : badgeColor, paddingVertical: variant === 'minimal' ? 0 : 2, paddingHorizontal: variant === 'minimal' ? 0 : 8 }}>
          {`${L.day} ${i + 1}`}
        </Text>
        {title ? (
          <Text style={{ fontSize: 12, fontWeight: 600, marginHorizontal: 8, color: dark ? '#FFFFFF' : NAVY, flexShrink: 1, textAlign: align }}>{title}</Text>
        ) : null}
        <View style={{ flexGrow: 1 }} />
        {mins > 0 ? (
          <View style={{ flexDirection: row }}>
            <Text style={{ fontSize: 9, color: dark ? '#9FB0CC' : MUTED, marginHorizontal: 2 }}>{L.approx}</Text>
            <Text style={{ fontSize: 9, fontWeight: 600, color: dark ? '#FFFFFF' : NAVY }}>{String(mins)}</Text>
            <Text style={{ fontSize: 9, color: dark ? '#9FB0CC' : MUTED, marginHorizontal: 2 }}>{L.minWord}</Text>
          </View>
        ) : null}
      </View>
    )
  }

  const head = (a: string, b: string | undefined, style: typeof s.cName | typeof s.cNum | { width: number }, isName = false) => (
    <View style={style}>
      <Text style={{ fontSize: 8.5, color: MUTED, fontWeight: 500, textAlign: isName ? align : 'center' }}>{a}</Text>
      {b ? <Text style={{ fontSize: 8, color: MUTED, textAlign: isName ? 'right' : 'center' }}>{b}</Text> : null}
    </View>
  )

  const tableHead = (d: Day) => {
    const k = repsHead(d) as 'reps' | 'time' | 'repsTime'
    return (
      <View style={s.th}>
        <View style={s.cIdx} />
        {head(L.exercise, L2?.exercise, s.cName, true)}
        {head(L.sets, L2?.sets, s.cNum)}
        {head(L[k], L2?.[k], { width: colRepsW(d) })}
        {head(L.rest, L2?.rest, s.cRest)}
        {hasLoad ? head(L.load, L2?.load, s.cLoad) : null}
      </View>
    )
  }

  const repsCell = (e: ExerciseEntry, d: Day) => {
    if (e.measure === 'time' && e.durationSec) {
      const x = splitDuration(e.durationSec)
      return <View style={{ width: colRepsW(d) }}>{inline(x.value, UNITS[primary][x.unit])}</View>
    }
    return <Text style={{ width: colRepsW(d), textAlign: 'center' }}>{e.reps || '-'}</Text>
  }

  const dayBlock = (day: Day, di: number) => {
    const labels = entryLabels(day.entries)
    return (
      <View key={day.id} wrap={day.entries.length > 12}>
        {dayHead(day, di)}
        {tableHead(day)}
        {day.entries.map((e, i) => {
          const ex = exMap.get(e.exerciseId)
          const nameP = ex ? ex.names[primary] || ex.names.en || ex.names.fr : '?'
          const nameS = ex && secondary ? ex.names[secondary] : ''
          const grouped = /[a-z]$/.test(labels[i])
          return (
            <View
              key={e.id}
              wrap={false}
              style={[
                s.tr,
                variant === 'clean' && i % 2 === 1 ? { backgroundColor: '#F8FAFD' } : {},
                grouped ? (rtl ? { borderRightWidth: 2, borderRightColor: accent } : { borderLeftWidth: 2, borderLeftColor: accent }) : {},
              ]}
            >
              <Text style={s.cIdx}>{labels[i]}</Text>
              <View style={s.cName}>
                <Text style={{ fontWeight: 500, textAlign: align }}>{nameP}</Text>
                {nameS ? <Text style={{ fontSize: 9, color: MUTED, textAlign: 'right' }}>{nameS}</Text> : null}
                {e.notes.trim() ? <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 1, textAlign: align }}>{e.notes.trim()}</Text> : null}
              </View>
              <Text style={s.cNum}>{e.sets}</Text>
              {repsCell(e, day)}
              <Text style={s.cRest}>{e.restSec ? String(e.restSec) : '-'}</Text>
              {hasLoad ? <Text style={s.cLoad}>{e.load.trim() || '-'}</Text> : null}
            </View>
          )
        })}
      </View>
    )
  }

  const weekBlock = (w: Week, wi: number) => {
    const custom = w.label.trim() && !DEFAULT_WEEK.test(w.label.trim()) ? w.label.trim() : ''
    return (
      <View key={w.id} break={wi > 0}>
        {program.weeks.length > 1 ? (
          <Text style={{ fontSize: 15, fontWeight: 700, color: accentOnPaper, marginTop: wi > 0 ? 0 : 6, textAlign: align }}>
            {custom || `${L.week} ${wi + 1}`}
          </Text>
        ) : null}
        {w.days.map(dayBlock)}
      </View>
    )
  }

  const header = (
    <View style={s.head}>
      <View style={s.brand}>
        {branding.logoDataUrl ? (
          <Image src={branding.logoDataUrl} style={s.logo} />
        ) : (
          <View style={s.initialsBox}>
            <Text style={{ color: variant === 'bold' ? onColor(accent) : '#FFFFFF', fontSize: 13, fontWeight: 700 }}>{initials}</Text>
          </View>
        )}
        <View style={s.brandText}>
          {coach ? <Text style={{ fontSize: 14, fontWeight: 600, color: variant === 'bold' ? '#FFFFFF' : NAVY, textAlign: align }}>{coach}</Text> : null}
          {handle ? <Text style={{ fontSize: 10, color: variant === 'bold' ? accentOnDark : accentOnPaper, textAlign: align }}>{`@${handle}`}</Text> : null}
        </View>
      </View>
      <View style={s.titleBox}>
        <Text style={{ fontSize: 8.5, color: variant === 'bold' ? '#9FB0CC' : MUTED, textAlign: rtl ? 'left' : 'right' }}>{L.program}</Text>
        <Text style={{ fontSize: 15, fontWeight: 700, color: variant === 'bold' ? '#FFFFFF' : NAVY, textAlign: rtl ? 'left' : 'right' }}>{program.title}</Text>
      </View>
    </View>
  )

  const stripItems: [string, string][] = client
    ? ([
        [L.client, client.name],
        [L.level, L.levels[client.level]],
        client.goal ? [L.goal, client.goal] : null,
        [L.daysWeek, String(client.daysPerWeek)],
      ].filter(Boolean) as [string, string][])
    : []

  return (
    <Document title={program.title} author={coach || 'FODX Coach'} creator="FODX Coach">
      <Page size="A4" style={s.page}>
        {variant === 'clean' && <View style={s.bar} />}
        {variant === 'bold' ? <View style={s.band}>{header}</View> : (
          <View style={{ marginBottom: 14, paddingBottom: variant === 'minimal' ? 12 : 0, borderBottomWidth: variant === 'minimal' ? 0.75 : 0, borderBottomColor: NAVY }}>{header}</View>
        )}

        {stripItems.length > 0 && (
          <View style={s.strip}>
            {stripItems.map(([k, v]) => (
              <View key={k} style={s.stripItem}>
                <Text style={{ color: MUTED, marginRight: rtl ? 0 : 4, marginLeft: rtl ? 4 : 0 }}>{`${k}:`}</Text>
                <Text style={{ fontWeight: 600 }}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {program.weeks.map(weekBlock)}

        {program.coachNote.trim() ? (
          <View style={s.note} wrap={false}>
            <Text style={{ fontSize: 8.5, color: MUTED, marginBottom: 2, textAlign: align }}>{L.coachNote}</Text>
            <Text style={{ textAlign: align, lineHeight: 1.4 }}>{program.coachNote.trim()}</Text>
          </View>
        ) : null}

        {qrDataUrl && handle ? (
          <View wrap={false} style={{ marginTop: 18, flexDirection: row, alignItems: 'center' }}>
            <Image src={qrDataUrl} style={{ width: 54, height: 54 }} />
            <View style={{ marginLeft: rtl ? 0 : 10, marginRight: rtl ? 10 : 0 }}>
              <Text style={{ fontSize: 9, color: MUTED, textAlign: align }}>{L.follow}</Text>
              <Text style={{ fontSize: 12, fontWeight: 600, color: accentOnPaper, textAlign: align }}>{`@${handle}`}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text style={{ fontSize: 8.5, color: MUTED }}>
            Made with <Text style={{ fontWeight: 700, color: accentOnPaper }}>FODX</Text> @fodxtech
          </Text>
          <View style={{ flexDirection: row }}>
            <Text style={{ fontSize: 8.5, color: MUTED, marginHorizontal: 4 }}>{L.page}</Text>
            <Text style={{ fontSize: 8.5, color: MUTED }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
