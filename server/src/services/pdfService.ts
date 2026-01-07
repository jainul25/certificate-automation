import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs/promises'

interface Position {
  x: number
  y: number
  width: number
  height: number
  page: number
}

interface FontSettings {
  family: string
  size: number
  color: string
  alignment: 'left' | 'center' | 'right'
}

// Map common font names to pdf-lib standard fonts
const fontMap: Record<string, typeof StandardFonts[keyof typeof StandardFonts]> = {
  'Helvetica': StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'Times-Roman': StandardFonts.TimesRoman,
  'Times-Bold': StandardFonts.TimesRomanBold,
  'Courier': StandardFonts.Courier,
  'Courier-Bold': StandardFonts.CourierBold,
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  }
}

export async function generateCertificatePdf(
  templatePath: string,
  name: string,
  position: Position,
  fontSettings: FontSettings
): Promise<Uint8Array> {
  // Load the template PDF
  const templateBytes = await fs.readFile(templatePath)
  const pdfDoc = await PDFDocument.load(templateBytes)

  // Get the page (single-page only, so always page 0)
  const pages = pdfDoc.getPages()
  const page = pages[0]
  const { height: pageHeight } = page.getSize()

  // Embed font
  const fontName = fontMap[fontSettings.family] || StandardFonts.Helvetica
  const font = await pdfDoc.embedFont(fontName)

  // Parse color
  const color = hexToRgb(fontSettings.color)

  // Calculate text width for alignment
  const textWidth = font.widthOfTextAtSize(name, fontSettings.size)

  // Calculate X position based on alignment
  let xPos = position.x
  if (fontSettings.alignment === 'center') {
    xPos = position.x + (position.width - textWidth) / 2
  } else if (fontSettings.alignment === 'right') {
    xPos = position.x + position.width - textWidth
  }

  // Ensure text stays within bounds
  xPos = Math.max(position.x, xPos)

  // Y position - PDF coordinates are from bottom-left
  // The position.y from the frontend is from the top of the marked area
  // We need to convert and center the text vertically in the marked area
  const textHeight = fontSettings.size
  const yPos = pageHeight - position.y - (position.height + textHeight) / 2

  // Draw the name text
  page.drawText(name, {
    x: xPos,
    y: yPos,
    size: fontSettings.size,
    font: font,
    color: rgb(color.r, color.g, color.b),
  })

  // Save and return the modified PDF
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

