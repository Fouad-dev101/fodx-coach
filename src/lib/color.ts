export const NAVY = '#0A1226'

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = toRgb(a)
  const [r2, g2, b2] = toRgb(b)
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export function luminance(hex: string) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Text color that stays readable on top of `bg`. */
export const onColor = (bg: string) => (luminance(bg) > 0.4 ? NAVY : '#FFFFFF')

/** Accent darkened until it is readable as text on white paper. */
export function accentText(accent: string) {
  let c = accent
  for (let i = 0; i < 6 && luminance(c) > 0.2; i++) c = mix(c, NAVY, 0.2)
  return c
}

export const isHex = (s: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)
