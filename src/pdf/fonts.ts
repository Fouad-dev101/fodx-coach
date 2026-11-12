import { Font } from '@react-pdf/renderer'

let registered = false

/**
 * IBM Plex Sans Arabic covers Arabic AND Latin in one family, so mixed lines
 * ("Squat 4×10 سكوات") stay in one font. Static TTFs on purpose: react-pdf is
 * unreliable with variable fonts.
 */
export function registerPdfFonts(base: string) {
  if (registered) return
  registered = true
  const f = (w: string) => `${base}IBMPlexSansArabic-${w}.ttf`
  Font.register({
    family: 'Plex',
    fonts: [
      { src: f('Regular'), fontWeight: 400 },
      { src: f('Medium'), fontWeight: 500 },
      { src: f('SemiBold'), fontWeight: 600 },
      { src: f('Bold'), fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
}
