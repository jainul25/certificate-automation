import fs from 'fs/promises'
import path from 'path'
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'
import mammoth from 'mammoth'

/**
 * Parse HTML content to DOCX paragraphs
 */
export async function htmlToDocxParagraphs(html: string): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = []
  
  // Simple HTML parser - extract text content and basic formatting
  const lines = html.split(/<\/?p>|<br\s*\/?>|\n/).filter(line => line.trim())
  
  for (const line of lines) {
    const text = line.replace(/<[^>]+>/g, '').trim()
    if (text) {
      // Check for formatting tags
      const isBold = /<b>|<strong>/.test(line)
      const isItalic = /<i>|<em>/.test(line)
      const isUnderline = /<u>/.test(line)
      
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: isBold,
              italics: isItalic,
              underline: isUnderline ? {} : undefined,
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      )
    }
  }
  
  return paragraphs
}

/**
 * Extract content from DOCX file
 */
export async function extractDocxContent(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('Error extracting DOCX content:', error)
    throw new Error('Failed to extract content from DOCX file')
  }
}

/**
 * Convert DOCX to HTML for preview
 */
export async function docxToHtml(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.convertToHtml({ buffer })
    return result.value
  } catch (error) {
    console.error('Error converting DOCX to HTML:', error)
    throw new Error('Failed to convert DOCX to HTML')
  }
}

/**
 * Create a simple DOCX document from HTML content
 */
export async function createDocxFromHtml(html: string, outputPath: string): Promise<void> {
  try {
    const paragraphs = await htmlToDocxParagraphs(html)
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    await fs.writeFile(outputPath, buffer)
  } catch (error) {
    console.error('Error creating DOCX from HTML:', error)
    throw new Error('Failed to create DOCX document')
  }
}

/**
 * Merge content into letterhead DOCX template
 * Reads the letterhead template and appends content to it
 */
export async function mergeDocxContent(
  letterheadPath: string,
  contentHtml: string | undefined,
  contentFilePath: string | undefined,
  outputPath: string
): Promise<void> {
  try {
    console.log('Starting DOCX merge...')
    
    // Read the letterhead template
    const letterheadBuffer = await fs.readFile(letterheadPath)
    console.log('Letterhead template loaded, size:', letterheadBuffer.length)
    
    // Get content paragraphs
    let contentParagraphs: Paragraph[] = []
    
    if (contentHtml) {
      console.log('Converting HTML content to paragraphs, HTML length:', contentHtml.length)
      contentParagraphs = await htmlToDocxParagraphs(contentHtml)
      console.log('Generated content paragraphs:', contentParagraphs.length)
    } else if (contentFilePath) {
      console.log('Extracting content from file:', contentFilePath)
      const extractedText = await extractDocxContent(contentFilePath)
      console.log('Extracted text length:', extractedText.length)
      contentParagraphs = await htmlToDocxParagraphs(`<p>${extractedText}</p>`)
      console.log('Generated content paragraphs:', contentParagraphs.length)
    }

    // Extract letterhead content as HTML
    console.log('Extracting letterhead content...')
    const letterheadHtml = await mammoth.convertToHtml({ buffer: letterheadBuffer })
    console.log('Letterhead HTML length:', letterheadHtml.value.length)
    
    // Parse letterhead paragraphs
    const letterheadParagraphs = await htmlToDocxParagraphs(letterheadHtml.value)
    console.log('Generated letterhead paragraphs:', letterheadParagraphs.length)
    
    // Add some spacing between letterhead and content
    const spacer = new Paragraph({
      text: '',
      spacing: { after: 400 },
    })
    
    // Create merged document with letterhead + content
    console.log('Creating merged document...')
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch in twips
                right: 1440, // 1 inch
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            ...letterheadParagraphs,
            spacer,
            ...contentParagraphs,
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    console.log('Document packed, buffer size:', buffer.length)
    
    await fs.writeFile(outputPath, buffer)
    console.log('Document saved to:', outputPath)
  } catch (error) {
    console.error('Error merging DOCX content:', error)
    throw new Error('Failed to merge DOCX content')
  }
}
