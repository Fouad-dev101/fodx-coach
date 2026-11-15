import { newWeek, useStore } from '../../store/useStore'
import { generateDays, type GenOpts } from '../../lib/generator'
import type { Key } from '../../i18n'
import type { Lang } from '../../types/model'

type Def = [Key, Pick<GenOpts, 'days' | 'goal' | 'level'>]

const DEFS: Def[] = [
  ['tpl_fullbody', { days: 3, goal: 'muscle', level: 'beginner' }],
  ['tpl_ul', { days: 4, goal: 'muscle', level: 'intermediate' }],
  ['tpl_ppl', { days: 6, goal: 'muscle', level: 'intermediate' }],
  ['tpl_fatloss', { days: 4, goal: 'fatloss', level: 'beginner' }],
]

/** Four ready-made templates so a new coach never faces an empty screen. */
export function addStarterTemplates(t: (k: Key) => string, lang: Lang) {
  const st = useStore.getState()
  // createProgram puts the newest first, so add in reverse to keep this order on screen.
  for (const [key, o] of [...DEFS].reverse()) {
    const days = generateDays({ ...o, warmup: true, dayLabel: t('day') }, st.exercises, lang)
    st.createProgram({ clientId: null, isTemplate: true, title: t(key), weeks: [newWeek(`${t('week')} 1`, days)] })
  }
}
