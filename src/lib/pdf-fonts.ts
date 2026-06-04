import { PDFDocument, PDFName, PDFDict, PDFContext } from 'pdf-lib'

export interface PdfFontInfo {
  name: string
  subtype: string
  embedded: boolean
}

function decodeName(pn: PDFName | null): string | null {
  return pn ? pn.decodeText() : null
}

export function extractPdfFonts(pdfDoc: PDFDocument): PdfFontInfo[] {
  const fonts = new Map<string, PdfFontInfo>()
  const context = (pdfDoc as unknown as { context: PDFContext }).context

  const objects = context.enumerateIndirectObjects()

  for (const [, obj] of objects) {
    if (!(obj instanceof PDFDict)) continue

    const type = obj.get(PDFName.of('Type'))
    if (!(type instanceof PDFName) || decodeName(type) !== 'Font') continue

    const baseFont = obj.get(PDFName.of('BaseFont'))
    const subtype = obj.get(PDFName.of('Subtype'))

    const fontName = baseFont instanceof PDFName ? decodeName(baseFont)! : 'Unknown'
    const fontSubtype = subtype instanceof PDFName ? decodeName(subtype)! : 'Unknown'

    if (fonts.has(fontName)) continue

    const fontDesc = obj.get(PDFName.of('FontDescriptor'))
    let embedded = false
    if (fontDesc instanceof PDFDict) {
      embedded = !!(
        fontDesc.get(PDFName.of('FontFile')) ||
        fontDesc.get(PDFName.of('FontFile2')) ||
        fontDesc.get(PDFName.of('FontFile3'))
      )
    }

    fonts.set(fontName, { name: fontName, subtype: fontSubtype, embedded })
  }

  return [...fonts.values()]
}