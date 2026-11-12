import type { Lang, Level } from '../types/model'

export interface PdfLabels {
  week: string
  day: string
  exercise: string
  sets: string
  reps: string
  rest: string
  client: string
  level: string
  goal: string
  daysWeek: string
  coachNote: string
  page: string
  sec: string
  program: string
  time: string
  repsTime: string
  load: string
  restWord: string
  approx: string
  minWord: string
  follow: string
  levels: Record<Level, string>
}

export const pdfLabels: Record<Lang, PdfLabels> = {
  fr: {
    week: 'Semaine', day: 'Jour', exercise: 'Exercice', sets: 'Séries', reps: 'Reps', rest: 'Repos (s)',
    client: 'Client', level: 'Niveau', goal: 'Objectif', daysWeek: 'Jours/semaine',
    coachNote: 'Mot du coach', page: 'Page', sec: 's', program: 'Programme', time: 'Durée', repsTime: 'Reps / Durée', load: 'Charge', restWord: 'repos', approx: '~', minWord: 'min', follow: 'Scanne pour me suivre',
    levels: { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' },
  },
  en: {
    week: 'Week', day: 'Day', exercise: 'Exercise', sets: 'Sets', reps: 'Reps', rest: 'Rest (s)',
    client: 'Client', level: 'Level', goal: 'Goal', daysWeek: 'Days/week',
    coachNote: 'Coach note', page: 'Page', sec: 's', program: 'Program', time: 'Time', repsTime: 'Reps / Time', load: 'Load', restWord: 'rest', approx: '~', minWord: 'min', follow: 'Scan to follow me',
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  },
  ar: {
    week: 'الأسبوع', day: 'اليوم', exercise: 'التمرين', sets: 'المجموعات', reps: 'التكرار', rest: 'الراحة (ث)',
    client: 'العميل', level: 'المستوى', goal: 'الهدف', daysWeek: 'أيام/أسبوع',
    coachNote: 'كلمة المدرب', page: 'صفحة', sec: 'ث', program: 'البرنامج', time: 'المدة', repsTime: 'التكرار / المدة', load: 'الحمل', restWord: 'راحة', approx: 'حوالي', minWord: 'دقيقة', follow: 'امسح الرمز لمتابعتي',
    levels: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' },
  },
}
