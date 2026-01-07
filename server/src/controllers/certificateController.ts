import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import archiver from 'archiver'
import { createError } from '../middleware/errorHandler.js'
import { getTemplateById } from './templateController.js'
import { generateCertificatePdf } from '../services/pdfService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface GenerationSession {
  id: string
  templateId: string
  participants: Array<{
    id: string
    name: string
    status: 'pending' | 'processed' | 'error'
    certificatePath?: string
    errorMessage?: string
  }>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  outputZipPath?: string
  createdAt: string
  completedAt?: string
}

const sessions = new Map<string, GenerationSession>()

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateId, participants } = req.body

    if (!templateId) {
      return next(createError('Template ID is required', 400, 'MISSING_TEMPLATE_ID'))
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return next(createError('Participants array is required', 400, 'MISSING_PARTICIPANTS'))
    }

    const template = getTemplateById(templateId)
    if (!template) {
      return next(createError('Template not found', 404, 'TEMPLATE_NOT_FOUND'))
    }

    if (!template.position || !template.fontSettings) {
      return next(createError('Template position not configured', 400, 'TEMPLATE_NOT_CONFIGURED'))
    }

    // Create session
    const sessionId = uuidv4()
    const session: GenerationSession = {
      id: sessionId,
      templateId,
      participants: participants.map((p: any) => ({
        id: p.id || uuidv4(),
        name: p.name,
        status: 'pending',
      })),
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    }

    sessions.set(sessionId, session)

    // Start generation process (async)
    processGeneration(session, template).catch(console.error)

    res.json({
      sessionId,
      status: 'processing',
      totalCount: participants.length,
    })
  } catch (error) {
    next(error)
  }
}

async function processGeneration(session: GenerationSession, template: any) {
  const outputDir = path.resolve(__dirname, '../../outputs', session.id)
  await fs.mkdir(outputDir, { recursive: true })

  const generatedFiles: Array<{ path: string; name: string }> = []

  for (let i = 0; i < session.participants.length; i++) {
    const participant = session.participants[i]

    try {
      const pdfBytes = await generateCertificatePdf(
        template.filePath,
        participant.name,
        template.position,
        template.fontSettings
      )

      const safeFileName = participant.name
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50)

      const fileName = `Certificate_${safeFileName}_${Date.now()}.pdf`
      const filePath = path.join(outputDir, fileName)

      await fs.writeFile(filePath, pdfBytes)

      participant.status = 'processed'
      participant.certificatePath = filePath

      generatedFiles.push({ path: filePath, name: fileName })
    } catch (error) {
      console.error(`Error generating certificate for ${participant.name}:`, error)
      participant.status = 'error'
      participant.errorMessage = error instanceof Error ? error.message : 'Generation failed'
    }

    // Update progress
    session.progress = Math.round(((i + 1) / session.participants.length) * 100)
    sessions.set(session.id, session)
  }

  // Create ZIP file
  if (generatedFiles.length > 0) {
    const zipFileName = `Certificates_${new Date().toISOString().slice(0, 10)}_${Date.now()}.zip`
    const zipPath = path.join(outputDir, zipFileName)

    await createZipArchive(generatedFiles, zipPath)
    session.outputZipPath = zipPath
  }

  session.status = session.participants.every((p) => p.status !== 'error') ? 'completed' : 'completed'
  session.completedAt = new Date().toISOString()
  sessions.set(session.id, session)
}

async function createZipArchive(
  files: Array<{ path: string; name: string }>,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', reject)

    archive.pipe(output)

    for (const file of files) {
      archive.file(file.path, { name: file.name })
    }

    archive.finalize()
  })
}

export async function getSessionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params
    const session = sessions.get(sessionId)

    if (!session) {
      return next(createError('Session not found', 404, 'SESSION_NOT_FOUND'))
    }

    const completedCount = session.participants.filter((p) => p.status === 'processed').length
    const errorCount = session.participants.filter((p) => p.status === 'error').length

    res.json({
      status: session.status,
      progress: session.progress,
      completedCount,
      errorCount,
      totalCount: session.participants.length,
      participants: session.participants,
    })
  } catch (error) {
    next(error)
  }
}

export async function downloadSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params
    const session = sessions.get(sessionId)

    if (!session) {
      return next(createError('Session not found', 404, 'SESSION_NOT_FOUND'))
    }

    if (!session.outputZipPath) {
      return next(createError('No files to download', 400, 'NO_FILES'))
    }

    // Check if file exists
    try {
      await fs.access(session.outputZipPath)
    } catch {
      return next(createError('Download file not found', 404, 'FILE_NOT_FOUND'))
    }

    const fileName = path.basename(session.outputZipPath)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    const fileStream = createReadStream(session.outputZipPath)
    fileStream.pipe(res)
  } catch (error) {
    next(error)
  }
}

export async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateId, name } = req.body

    if (!templateId || !name) {
      return next(createError('Template ID and name are required', 400, 'MISSING_PARAMS'))
    }

    const template = getTemplateById(templateId)
    if (!template) {
      return next(createError('Template not found', 404, 'TEMPLATE_NOT_FOUND'))
    }

    if (!template.position || !template.fontSettings) {
      return next(createError('Template position not configured', 400, 'TEMPLATE_NOT_CONFIGURED'))
    }

    const pdfBytes = await generateCertificatePdf(
      template.filePath,
      name,
      template.position,
      template.fontSettings
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="preview.pdf"`)
    res.send(Buffer.from(pdfBytes))
  } catch (error) {
    next(error)
  }
}

