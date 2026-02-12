import fs from 'fs/promises'
import path from 'path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as docxService from './docxService.js'
import * as conversionService from './conversionService.js'

/**
 * Merge content with DOCX letterhead template
 */
export async function mergeDocxLetterhead(
  letterheadPath: string,
  contentSource: string,
  contentHtml: string | undefined,
  contentFilePath: string | undefined,
  outputDir: string,
  sessionId: string,
  outputFormat: string
): Promise<string> {
  try {
    // Create merged DOCX file
    const mergedDocxPath = path.join(outputDir, `letterhead_${sessionId}.docx`)
    
    await docxService.mergeDocxContent(
      letterheadPath,
      contentHtml,
      contentFilePath,
      mergedDocxPath
    )

    // If PDF output is requested, convert
    if (outputFormat === 'pdf') {
      const pdfPath = path.join(outputDir, `letterhead_${sessionId}.pdf`)
      
      try {
        await conversionService.docxToPdfWithLibreOffice(mergedDocxPath, pdfPath)
        // Keep the DOCX as well for reference
        return pdfPath
      } catch (conversionError) {
        console.warn('PDF conversion failed, returning DOCX:', conversionError)
        return mergedDocxPath
      }
    }

    return mergedDocxPath
  } catch (error) {
    console.error('Error merging DOCX letterhead:', error)
    throw error
  }
}

/**
 * Merge content with PDF letterhead template
 */
export async function mergePdfLetterhead(
  letterheadPath: string,
  contentSource: string,
  contentHtml: string | undefined,
  contentFilePath: string | undefined,
  outputDir: string,
  sessionId: string,
  outputFormat: string
): Promise<string> {
  try {
    // Load the letterhead PDF
    const letterheadBytes = await fs.readFile(letterheadPath)
    const letterheadDoc = await PDFDocument.load(letterheadBytes)
    
    // Get the first page dimensions
    const pages = letterheadDoc.getPages()
    if (pages.length === 0) {
      throw new Error('Letterhead PDF has no pages')
    }
    
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Create a new PDF document for the final output
    const finalDoc = await PDFDocument.create()
    
    // Copy the letterhead page
    const [copiedPage] = await finalDoc.copyPages(letterheadDoc, [0])
    finalDoc.addPage(copiedPage)

    // Get content text
    let contentText = ''
    if (contentSource === 'editor' && contentHtml) {
      // Strip HTML tags for simple text extraction, preserving some structure
      contentText = contentHtml
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n\s*\n/g, '\n')
        .trim()
      
      console.log('Extracted content text length:', contentText.length)
    } else if (contentSource === 'upload' && contentFilePath) {
      contentText = await docxService.extractDocxContent(contentFilePath)
      console.log('Extracted content from file, length:', contentText.length)
    }
    
    if (!contentText) {
      console.warn('No content text extracted!')
    }

    // Add content to the page
    if (contentText) {
      const page = finalDoc.getPage(0)
      const font = await finalDoc.embedFont(StandardFonts.Helvetica)
      
      const fontSize = 12
      const margin = 72 // 1 inch
      const lineHeight = fontSize * 1.5
      const maxWidth = width - (margin * 2)
      
      // Start content below letterhead (roughly 1/3 down)
      const startY = height - (height / 3)
      
      // Split content into lines that fit
      const words = contentText.split(/\s+/)
      const lines: string[] = []
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = font.widthOfTextAtSize(testLine, fontSize)
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) {
        lines.push(currentLine)
      }

      // Draw text lines
      let y = startY
      for (const line of lines) {
        if (y < margin + lineHeight) {
          // Need a new page
          const [newLetterheadPage] = await finalDoc.copyPages(letterheadDoc, [0])
          finalDoc.addPage(newLetterheadPage)
          const newPage = finalDoc.getPage(finalDoc.getPageCount() - 1)
          y = startY
          
          newPage.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          })
        } else {
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          })
        }
        
        y -= lineHeight
      }
    }

    // Save the final PDF
    const outputPath = path.join(outputDir, `letterhead_${sessionId}.pdf`)
    const pdfBytes = await finalDoc.save()
    await fs.writeFile(outputPath, pdfBytes)

    // If DOCX output is requested, we can't easily convert PDF back to DOCX
    // So we'll return the PDF with a note
    if (outputFormat === 'docx') {
      console.warn('DOCX output requested but letterhead is PDF. Returning PDF.')
    }

    return outputPath
  } catch (error) {
    console.error('Error merging PDF letterhead:', error)
    throw error
  }
}

/**
 * Generate preview of merged document
 */
export async function generatePreview(
  letterheadPath: string,
  contentHtml: string,
  isDocx: boolean
): Promise<string> {
  try {
    if (isDocx) {
      return await docxService.docxToHtml(letterheadPath)
    } else {
      // For PDF, return a data URL or path to preview
      return letterheadPath
    }
  } catch (error) {
    console.error('Error generating preview:', error)
    throw error
  }
}
