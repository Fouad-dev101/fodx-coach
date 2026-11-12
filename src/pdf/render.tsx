import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import ProgramPdf from './ProgramPdf'
import { registerPdfFonts } from './fonts'
import type { Branding, Client, Exercise, Program } from '../types/model'

export async function makeQr(handle: string) {
  const h = handle.trim().replace(/^@/, '')
  if (!h) return undefined
  try {
    return await QRCode.toDataURL(`https://instagram.com/${h}`, {
      margin: 1, width: 240, color: { dark: '#0A1226', light: '#FFFFFF' },
    })
  } catch {
    return undefined // a QR failure must never block the PDF
  }
}

/** Browser entry point. Loaded lazily so the PDF engine does not slow first load. */
export async function renderProgramPdf(input: {
  program: Program
  client?: Client | null
  exercises: Exercise[]
  branding: Branding
}): Promise<Blob> {
  registerPdfFonts(import.meta.env.BASE_URL + 'fonts/')
  const qrDataUrl = input.branding.showQr === false ? undefined : await makeQr(input.branding.instagram)
  return pdf(<ProgramPdf {...input} qrDataUrl={qrDataUrl} />).toBlob()
}
