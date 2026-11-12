import type { Exercise, Lang } from '../types/model'

export const exName = (ex: Exercise, lang: Lang) => ex.names[lang] || ex.names.en || ex.names.fr || ex.names.ar
