import { Request, Response, NextFunction } from 'express'
import fs from 'fs/promises'
import * as XLSX from 'xlsx'
import { v4 as uuidv4 } from 'uuid'
import { createError } from '../middleware/errorHandler.js'
import { validateParticipantName, sanitizeName } from '../middleware/validation.js'

interface ParsedParticipant {
  id: string
  name: string
  email?: string
  status: 'pending' | 'error'
  errorMessage?: string
}

export async function parseManual(req: Request, res: Response, next: NextFunction) {
  try {
    const { names } = req.body

    if (!names || !Array.isArray(names)) {
      return next(createError('Names array is required', 400, 'INVALID_INPUT'))
    }

    const participants: ParsedParticipant[] = []
    const seen = new Set<string>()

    for (const name of names) {
      if (!name || typeof name !== 'string') continue

      const trimmed = name.trim()
      if (!trimmed) continue

      // Check for duplicates (case-insensitive)
      const normalized = trimmed.toLowerCase()
      if (seen.has(normalized)) continue
      seen.add(normalized)

      const validation = validateParticipantName(trimmed)
      const sanitized = sanitizeName(trimmed)

      participants.push({
        id: uuidv4(),
        name: sanitized,
        status: validation.valid ? 'pending' : 'error',
        errorMessage: validation.error,
      })
    }

    res.json({
      participants,
      count: participants.filter((p) => p.status === 'pending').length,
      total: participants.length,
    })
  } catch (error) {
    next(error)
  }
}

export async function parseExcel(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400, 'NO_FILE'))
    }

    const filePath = req.file.path

    // Read Excel file
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      await fs.unlink(filePath)
      return next(createError('Excel file has no sheets', 400, 'INVALID_EXCEL'))
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })

    // Clean up uploaded file
    await fs.unlink(filePath).catch(() => {})

    if (jsonData.length === 0) {
      return next(createError('Excel file is empty', 400, 'EMPTY_EXCEL'))
    }

    // Skip header row if it looks like a header
    const startIndex = isHeaderRow(jsonData[0]) ? 1 : 0
    
    const participants: ParsedParticipant[] = []
    const errors: string[] = []
    const seen = new Set<string>()

    for (let i = startIndex; i < jsonData.length; i++) {
      const row = jsonData[i]
      const name = row?.[0] // First column (Column A)
      const email = row?.[1] // Second column (Column B)

      if (!name || typeof name !== 'string') {
        if (row && row.length > 0) {
          errors.push(`Row ${i + 1}: Empty or invalid name`)
        }
        continue
      }

      const trimmed = String(name).trim()
      if (!trimmed) continue

      // Check for duplicates
      const normalized = trimmed.toLowerCase()
      if (seen.has(normalized)) {
        errors.push(`Row ${i + 1}: Duplicate name "${trimmed}"`)
        continue
      }
      seen.add(normalized)

      const validation = validateParticipantName(trimmed)
      const sanitized = sanitizeName(trimmed)

      // Parse and validate email if provided
      let participantEmail: string | undefined
      let emailError: string | undefined

      if (email && typeof email === 'string') {
        const trimmedEmail = String(email).trim()
        if (trimmedEmail) {
          participantEmail = trimmedEmail
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(trimmedEmail)) {
            emailError = 'Invalid email format'
            errors.push(`Row ${i + 1}: Invalid email "${trimmedEmail}"`)
          }
        }
      }

      if (!validation.valid) {
        errors.push(`Row ${i + 1}: ${validation.error}`)
      }

      participants.push({
        id: uuidv4(),
        name: sanitized,
        email: participantEmail,
        status: validation.valid && !emailError ? 'pending' : 'error',
        errorMessage: validation.error || emailError,
      })
    }

    res.json({
      participants,
      count: participants.filter((p) => p.status === 'pending').length,
      total: participants.length,
      errors,
    })
  } catch (error) {
    // Clean up file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    next(error)
  }
}

function isHeaderRow(row: any[]): boolean {
  if (!row || row.length === 0) return false
  const firstCell = String(row[0] || '').toLowerCase()
  const secondCell = String(row[1] || '').toLowerCase()
  const headerKeywords = ['name', 'participant', 'student', 'attendee', 'person', 'full name']
  const emailKeywords = ['email', 'e-mail', 'mail', 'address']
  
  const hasNameHeader = headerKeywords.some((keyword) => firstCell.includes(keyword))
  const hasEmailHeader = emailKeywords.some((keyword) => secondCell.includes(keyword))
  
  return hasNameHeader || hasEmailHeader
}

