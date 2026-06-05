import { PDFDocument } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const fontCompatibilityCache = new Map<string, boolean>()

export async function testFontCompatibility(fontBytes: Uint8Array, fontKey: string): Promise<boolean> {
  const cached = fontCompatibilityCache.get(fontKey)
  if (cached !== undefined) return cached

  try {
    const testDoc = await PDFDocument.create()
    testDoc.registerFontkit(fontkit)
    const font = await testDoc.embedFont(fontBytes)
    const testPage = testDoc.addPage()
    testPage.drawText(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/',
      { font, size: 12 },
    )
    await testDoc.save()
    fontCompatibilityCache.set(fontKey, true)
    return true
  } catch {
    fontCompatibilityCache.set(fontKey, false)
    return false
  }
}

export function clearFontCompatibilityCache(): void {
  fontCompatibilityCache.clear()
}
