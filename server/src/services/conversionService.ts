import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import libre from 'libreoffice-convert'

const execAsync = promisify(exec)
const convertAsync = promisify(libre.convert)

/**
 * Convert DOCX to PDF using LibreOffice
 * Requires LibreOffice to be installed on the system
 */
export async function docxToPdfWithLibreOffice(docxPath: string, outputPdfPath: string): Promise<void> {
  try {
    const outputDir = path.dirname(outputPdfPath)
    const outputBasename = path.basename(outputPdfPath, '.pdf')
    
    // Try using libreoffice command line
    try {
      await execAsync(
        `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`
      )
      
      // LibreOffice outputs with the same base name
      const generatedPdf = path.join(outputDir, path.basename(docxPath, '.docx') + '.pdf')
      
      // Rename to desired output name
      if (generatedPdf !== outputPdfPath) {
        await fs.rename(generatedPdf, outputPdfPath)
      }
    } catch (cmdError) {
      console.log('LibreOffice command not found, trying libre-office-convert library...')
      
      // Fallback to libre-office-convert library
      const docxBuffer = await fs.readFile(docxPath)
      const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined) as Buffer
      await fs.writeFile(outputPdfPath, pdfBuffer)
    }
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error)
    throw new Error('Failed to convert DOCX to PDF. Please ensure LibreOffice is installed.')
  }
}

/**
 * Convert HTML to PDF (basic implementation)
 * For production, consider using puppeteer or similar
 */
export async function htmlToPdf(html: string, outputPdfPath: string): Promise<void> {
  try {
    // This is a placeholder - in production, use puppeteer, playwright, or similar
    // For now, we'll create a temporary HTML file and convert it
    const tempHtmlPath = outputPdfPath.replace('.pdf', '.html')
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `
    
    await fs.writeFile(tempHtmlPath, htmlContent)
    
    // Try to convert using wkhtmltopdf if available
    try {
      await execAsync(`wkhtmltopdf "${tempHtmlPath}" "${outputPdfPath}"`)
      await fs.unlink(tempHtmlPath)
    } catch (cmdError) {
      console.error('wkhtmltopdf not available. Keeping HTML file as fallback.')
      throw new Error('PDF conversion not available. Please install wkhtmltopdf or use DOCX output.')
    }
  } catch (error) {
    console.error('Error converting HTML to PDF:', error)
    throw error
  }
}

/**
 * Check if LibreOffice is available
 */
export async function isLibreOfficeAvailable(): Promise<boolean> {
  try {
    await execAsync('libreoffice --version')
    return true
  } catch {
    return false
  }
}

/**
 * Check if wkhtmltopdf is available
 */
export async function isWkhtmltopdfAvailable(): Promise<boolean> {
  try {
    await execAsync('wkhtmltopdf --version')
    return true
  } catch {
    return false
  }
}
