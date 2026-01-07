import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { PDFDocument } from 'pdf-lib'
import { createError } from '../middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// In-memory template store (simple for single-user app)
interface StoredTemplate {
  id: string
  name: string
  filename: string
  filePath: string
  originalName: string
  position?: {
    x: number
    y: number
    width: number
    height: number
    page: number
  }
  fontSettings?: {
    family: string
    size: number
    color: string
    alignment: 'left' | 'center' | 'right'
  }
  pageCount: number
  pageWidth: number
  pageHeight: number
  createdAt: string
  updatedAt: string
}

const templates = new Map<string, StoredTemplate>()

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400, 'NO_FILE'))
    }

    const file = req.file
    const filePath = file.path
    
    // Validate PDF and get page info
    const pdfBytes = await fs.readFile(filePath)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      await fs.unlink(filePath)
      return next(createError('PDF has no pages', 400, 'INVALID_PDF'))
    }

    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    const templateId = uuidv4()
    const template: StoredTemplate = {
      id: templateId,
      name: file.originalname.replace(/\.pdf$/i, ''),
      filename: file.filename,
      filePath: filePath,
      originalName: file.originalname,
      pageCount: pages.length,
      pageWidth: width,
      pageHeight: height,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    templates.set(templateId, template)

    res.json({
      templateId,
      previewUrl: `/uploads/templates/${file.filename}`,
      pageCount: pages.length,
      pageWidth: width,
      pageHeight: height,
      name: template.name,
    })
  } catch (error) {
    next(error)
  }
}

export async function savePosition(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { position, fontSettings } = req.body

    const template = templates.get(id)
    if (!template) {
      return next(createError('Template not found', 404, 'TEMPLATE_NOT_FOUND'))
    }

    template.position = position
    template.fontSettings = fontSettings || {
      family: 'Helvetica',
      size: 36,
      color: '#000000',
      alignment: 'center',
    }
    template.updatedAt = new Date().toISOString()

    templates.set(id, template)

    res.json({ success: true, template })
  } catch (error) {
    next(error)
  }
}

export async function getTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const template = templates.get(id)

    if (!template) {
      return next(createError('Template not found', 404, 'TEMPLATE_NOT_FOUND'))
    }

    res.json({
      ...template,
      previewUrl: `/uploads/templates/${template.filename}`,
    })
  } catch (error) {
    next(error)
  }
}

export async function getAllTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const allTemplates = Array.from(templates.values()).map((t) => ({
      ...t,
      previewUrl: `/uploads/templates/${t.filename}`,
    }))

    res.json(allTemplates)
  } catch (error) {
    next(error)
  }
}

// Export for use in certificate generation
export function getTemplateById(id: string): StoredTemplate | undefined {
  return templates.get(id)
}

