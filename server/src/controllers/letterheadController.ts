import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { createError } from '../middleware/errorHandler.js'
import * as letterheadService from '../services/letterheadService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// In-memory storage for letterhead sessions
interface LetterheadSession {
  id: string
  templateId: string
  templatePath: string
  templateType: 'pdf' | 'docx'
  contentSource: 'editor' | 'upload'
  contentHtml?: string
  contentFilePath?: string
  generatedDocPath?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  createdAt: string
  updatedAt: string
}

interface LetterheadTemplate {
  id: string
  filename: string
  originalName: string
  filePath: string
  fileType: 'pdf' | 'docx'
  createdAt: string
}

const templates = new Map<string, LetterheadTemplate>()
const sessions = new Map<string, LetterheadSession>()

export async function uploadTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400, 'NO_FILE'))
    }

    const file = req.file
    const fileType = path.extname(file.originalname).toLowerCase() === '.pdf' ? 'pdf' : 'docx'

    const templateId = uuidv4()
    const template: LetterheadTemplate = {
      id: templateId,
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileType,
      createdAt: new Date().toISOString(),
    }

    templates.set(templateId, template)

    res.json({
      templateId,
      filename: file.filename,
      originalName: file.originalname,
      fileType,
      previewUrl: `/uploads/letterheads/templates/${file.filename}`,
    })
  } catch (error) {
    next(error)
  }
}

export async function uploadContent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400, 'NO_FILE'))
    }

    const file = req.file

    res.json({
      contentId: uuidv4(),
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
    })
  } catch (error) {
    next(error)
  }
}

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateId, contentSource, contentHtml, contentFilePath, outputFormat } = req.body

    if (!templateId) {
      return next(createError('Template ID is required', 400, 'MISSING_TEMPLATE_ID'))
    }

    const template = templates.get(templateId)
    if (!template) {
      return next(createError('Template not found', 404, 'TEMPLATE_NOT_FOUND'))
    }

    if (contentSource === 'editor' && !contentHtml) {
      return next(createError('Content HTML is required', 400, 'MISSING_CONTENT'))
    }

    if (contentSource === 'upload' && !contentFilePath) {
      return next(createError('Content file path is required', 400, 'MISSING_CONTENT_FILE'))
    }

    const sessionId = uuidv4()
    const session: LetterheadSession = {
      id: sessionId,
      templateId,
      templatePath: template.filePath,
      templateType: template.fileType,
      contentSource,
      contentHtml: contentSource === 'editor' ? contentHtml : undefined,
      contentFilePath: contentSource === 'upload' ? contentFilePath : undefined,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    sessions.set(sessionId, session)

    // Process in background
    processLetterhead(sessionId, template, contentSource, contentHtml, contentFilePath, outputFormat || 'pdf')
      .catch((error) => {
        console.error('Error processing letterhead:', error)
        const errorSession = sessions.get(sessionId)
        if (errorSession) {
          errorSession.status = 'failed'
          errorSession.error = error.message
          errorSession.updatedAt = new Date().toISOString()
          sessions.set(sessionId, errorSession)
        }
      })

    res.json({
      sessionId,
      status: 'processing',
    })
  } catch (error) {
    next(error)
  }
}

async function processLetterhead(
  sessionId: string,
  template: LetterheadTemplate,
  contentSource: string,
  contentHtml: string | undefined,
  contentFilePath: string | undefined,
  outputFormat: string
) {
  try {
    console.log(`Processing letterhead for session ${sessionId}`)
    console.log(`Template type: ${template.fileType}`)
    console.log(`Content source: ${contentSource}`)
    console.log(`Output format: ${outputFormat}`)
    
    const outputDir = path.resolve(__dirname, '../../uploads/letterheads/generated')
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })

    let generatedDocPath: string

    if (template.fileType === 'docx') {
      console.log('Merging DOCX letterhead...')
      // DOCX letterhead
      generatedDocPath = await letterheadService.mergeDocxLetterhead(
        template.filePath,
        contentSource,
        contentHtml,
        contentFilePath,
        outputDir,
        sessionId,
        outputFormat
      )
      console.log(`DOCX merge completed: ${generatedDocPath}`)
    } else {
      console.log('Merging PDF letterhead...')
      // PDF letterhead
      generatedDocPath = await letterheadService.mergePdfLetterhead(
        template.filePath,
        contentSource,
        contentHtml,
        contentFilePath,
        outputDir,
        sessionId,
        outputFormat
      )
      console.log(`PDF merge completed: ${generatedDocPath}`)
    }

    const session = sessions.get(sessionId)
    if (session) {
      session.generatedDocPath = generatedDocPath
      session.status = 'completed'
      session.updatedAt = new Date().toISOString()
      sessions.set(sessionId, session)
      console.log(`Session ${sessionId} completed successfully`)
    }
  } catch (error) {
    console.error(`Error processing letterhead for session ${sessionId}:`, error)
    throw error
  }
}

export async function getDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const session = sessions.get(id)

    if (!session) {
      return next(createError('Document not found', 404, 'DOCUMENT_NOT_FOUND'))
    }

    res.json({
      ...session,
      previewUrl: session.generatedDocPath
        ? `/uploads/letterheads/generated/${path.basename(session.generatedDocPath)}`
        : null,
    })
  } catch (error) {
    next(error)
  }
}

export async function download(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const session = sessions.get(id)

    if (!session) {
      return next(createError('Document not found', 404, 'DOCUMENT_NOT_FOUND'))
    }

    if (session.status !== 'completed' || !session.generatedDocPath) {
      return next(createError('Document not ready', 400, 'DOCUMENT_NOT_READY'))
    }

    const fileExists = await fs.access(session.generatedDocPath).then(() => true).catch(() => false)
    if (!fileExists) {
      return next(createError('Generated file not found', 404, 'FILE_NOT_FOUND'))
    }

    const ext = path.extname(session.generatedDocPath)
    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="letterhead-document${ext}"`)
    
    const fileStream = await fs.readFile(session.generatedDocPath)
    res.send(fileStream)
  } catch (error) {
    next(error)
  }
}
