import type { Exercise, ExerciseDefaults, Muscle } from '../types/model'

// [muscle, en, fr, ar]. Arabic names are a starting point: have a few coaches review them.
type Row = [Muscle, string, string, string]

const rows: Row[] = [
  ['chest', 'Bench press', 'Développé couché', 'ضغط الصدر بالبار'],
  ['chest', 'Incline bench press', 'Développé incliné', 'ضغط الصدر المائل'],
  ['chest', 'Decline bench press', 'Développé décliné', 'ضغط الصدر المنحدر'],
  ['chest', 'Dumbbell bench press', 'Développé couché haltères', 'ضغط الصدر بالدمبل'],
  ['chest', 'Incline dumbbell press', 'Développé incliné haltères', 'ضغط مائل بالدمبل'],
  ['chest', 'Dumbbell fly', 'Écarté haltères', 'فتح الصدر بالدمبل'],
  ['chest', 'Cable crossover', 'Vis-à-vis poulie', 'كروس أوفر بالكابل'],
  ['chest', 'Pec deck', 'Pec deck (papillon)', 'آلة الفراشة'],
  ['chest', 'Push-up', 'Pompes', 'تمرين الضغط'],
  ['chest', 'Chest dips', 'Dips pectoraux', 'الديبس للصدر'],

  ['back', 'Pull-up', 'Tractions', 'العقلة'],
  ['back', 'Lat pulldown', 'Tirage vertical', 'سحب علوي بالكابل'],
  ['back', 'Barbell row', 'Rowing barre', 'تجديف بالبار'],
  ['back', 'One-arm dumbbell row', 'Rowing haltère un bras', 'تجديف بالدمبل بذراع واحدة'],
  ['back', 'Seated cable row', 'Tirage horizontal poulie', 'تجديف جالس بالكابل'],
  ['back', 'T-bar row', 'Rowing T-bar', 'تجديف تي بار'],
  ['back', 'Deadlift', 'Soulevé de terre', 'الرفعة الميتة'],
  ['back', 'Face pull', 'Face pull', 'سحب الوجه بالكابل'],
  ['back', 'Back extension', 'Extension lombaire', 'تمديد أسفل الظهر'],

  ['shoulders', 'Overhead press', 'Développé militaire', 'ضغط الكتف بالبار'],
  ['shoulders', 'Dumbbell shoulder press', 'Développé épaules haltères', 'ضغط الكتف بالدمبل'],
  ['shoulders', 'Lateral raise', 'Élévations latérales', 'رفرفة جانبية'],
  ['shoulders', 'Front raise', 'Élévations frontales', 'رفرفة أمامية'],
  ['shoulders', 'Rear delt fly', 'Oiseau (deltoïdes postérieurs)', 'رفرفة خلفية'],
  ['shoulders', 'Upright row', 'Rowing menton', 'سحب عمودي للذقن'],
  ['shoulders', 'Shrug', "Haussements d'épaules", 'رفع الأكتاف'],

  ['biceps', 'Barbell curl', 'Curl barre', 'كيرل بالبار'],
  ['biceps', 'Dumbbell curl', 'Curl haltères', 'كيرل بالدمبل'],
  ['biceps', 'Hammer curl', 'Curl marteau', 'كيرل المطرقة'],
  ['biceps', 'Preacher curl', 'Curl pupitre', 'كيرل بريتشر'],
  ['biceps', 'Cable curl', 'Curl poulie', 'كيرل بالكابل'],

  ['triceps', 'Triceps pushdown', 'Extension triceps poulie haute', 'ضغط ترايسبس بالكابل'],
  ['triceps', 'Skull crusher', 'Barre au front', 'تمديد ترايسبس مستلقي'],
  ['triceps', 'Overhead triceps extension', 'Extension triceps au-dessus de la tête', 'تمديد ترايسبس فوق الرأس'],
  ['triceps', 'Close-grip bench press', 'Développé couché prise serrée', 'ضغط صدر بقبضة ضيقة'],
  ['triceps', 'Bench dips', 'Dips sur banc', 'ديبس على الدكة'],

  ['forearms', 'Wrist curl', 'Curl poignets', 'ثني الرسغ'],
  ['forearms', "Farmer's walk", 'Marche du fermier', 'مشي المزارع'],

  ['quads', 'Squat', 'Squat', 'سكوات'],
  ['quads', 'Front squat', 'Squat avant', 'سكوات أمامي'],
  ['quads', 'Leg press', 'Presse à cuisses', 'ضغط الأرجل بالآلة'],
  ['quads', 'Leg extension', 'Leg extension', 'تمديد الأرجل بالآلة'],
  ['quads', 'Walking lunge', 'Fentes marchées', 'لانجز بالمشي'],
  ['quads', 'Bulgarian split squat', 'Squat bulgare', 'سكوات بلغاري'],
  ['quads', 'Hack squat', 'Hack squat', 'هاك سكوات'],

  ['hamstrings', 'Romanian deadlift', 'Soulevé de terre roumain', 'رفعة ميتة رومانية'],
  ['hamstrings', 'Lying leg curl', 'Leg curl allongé', 'ثني الأرجل مستلقي'],
  ['hamstrings', 'Seated leg curl', 'Leg curl assis', 'ثني الأرجل جالس'],
  ['hamstrings', 'Good morning', 'Good morning', 'غود مورنينغ'],

  ['glutes', 'Hip thrust', 'Hip thrust', 'رفع الحوض'],
  ['glutes', 'Glute bridge', 'Pont fessier', 'جسر الأرداف'],
  ['glutes', 'Cable kickback', 'Kickback poulie', 'ركلة خلفية بالكابل'],
  ['glutes', 'Step-up', 'Montée sur banc', 'صعود الدكة'],

  ['calves', 'Standing calf raise', 'Mollets debout', 'رفع السمانة واقفاً'],
  ['calves', 'Seated calf raise', 'Mollets assis', 'رفع السمانة جالساً'],

  ['abs', 'Crunch', 'Crunch', 'كرنش'],
  ['abs', 'Plank', 'Gainage', 'البلانك'],
  ['abs', 'Hanging leg raise', 'Relevé de jambes suspendu', 'رفع الأرجل معلقاً'],
  ['abs', 'Russian twist', 'Rotation russe', 'الدوران الروسي'],
  ['abs', 'Ab wheel rollout', 'Roue abdominale', 'عجلة البطن'],
  ['abs', 'Cable crunch', 'Crunch poulie', 'كرنش بالكابل'],

  ['fullbody', 'Burpee', 'Burpees', 'بيربي'],
  ['fullbody', 'Kettlebell swing', 'Swing kettlebell', 'أرجحة الكيتل بيل'],
  ['fullbody', 'Warm-up', 'Échauffement', 'الإحماء'],
  ['fullbody', 'Stretching', 'Étirements', 'تمارين الإطالة'],

  ['cardio', 'Treadmill run', 'Course sur tapis', 'جري على السير'],
  ['cardio', 'Rowing machine', 'Rameur', 'آلة التجديف'],
  ['cardio', 'Stationary bike', 'Vélo stationnaire', 'دراجة ثابتة'],
  ['cardio', 'Jump rope', 'Corde à sauter', 'نط الحبل'],
]

// Exercises measured in time, not reps: [sets, seconds, rest]
const TIMED: Record<string, [number, number, number | null]> = {
  Plank: [3, 45, 45],
  'Warm-up': [1, 300, null],
  Stretching: [1, 300, null],
  'Treadmill run': [1, 600, null],
  'Rowing machine': [1, 600, null],
  'Stationary bike': [1, 600, null],
  'Jump rope': [3, 60, 30],
  "Farmer's walk": [3, 40, 60],
}

const COMPOUND = new Set([
  'Bench press', 'Incline bench press', 'Overhead press', 'Squat', 'Front squat', 'Deadlift',
  'Romanian deadlift', 'Barbell row', 'Pull-up', 'Leg press', 'Hip thrust', 'Close-grip bench press',
])

export function defaultsFor(en: string): { measure: 'reps' | 'time'; defaults: ExerciseDefaults } {
  const t = TIMED[en]
  if (t) return { measure: 'time', defaults: { sets: t[0], reps: '', durationSec: t[1], restSec: t[2] } }
  if (COMPOUND.has(en)) return { measure: 'reps', defaults: { sets: 4, reps: '8', durationSec: null, restSec: 90 } }
  return { measure: 'reps', defaults: { sets: 3, reps: '10-12', durationSec: null, restSec: 60 } }
}

export function seedExercises(): Exercise[] {
  return rows.map(([muscle, en, fr, ar], i) => ({
    id: `seed-${i + 1}`,
    muscle,
    builtin: true,
    names: { en, fr, ar },
    ...defaultsFor(en),
  }))
}
