import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'

export function validateParticipantName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name must be a non-empty string' }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be at most 100 characters' }
  }

  // Allow letters (including international), spaces, hyphens, apostrophes, and periods
  const validPattern = /^[\p{L}\s\-'.]+$/u
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' }
  }

  return { valid: true }
}

export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\p{L}\s\-'.]/gu, '') // Remove invalid characters
}

export function validatePosition(req: Request, res: Response, next: NextFunction) {
  const { position, fontSettings } = req.body

  if (!position || typeof position !== 'object') {
    return next(createError('Position data is required', 400, 'INVALID_POSITION'))
  }

  const { x, y, width, height, page } = position

  if (typeof x !== 'number' || typeof y !== 'number') {
    return next(createError('Position x and y must be numbers', 400, 'INVALID_POSITION'))
  }

  if (typeof width !== 'number' || typeof height !== 'number') {
    return next(createError('Position width and height must be numbers', 400, 'INVALID_POSITION'))
  }

  if (typeof page !== 'number' || page < 0) {
    return next(createError('Page must be a non-negative number', 400, 'INVALID_POSITION'))
  }

  if (fontSettings) {
    const { family, size, color, alignment } = fontSettings

    if (family && typeof family !== 'string') {
      return next(createError('Font family must be a string', 400, 'INVALID_FONT_SETTINGS'))
    }

    if (size && (typeof size !== 'number' || size < 8 || size > 144)) {
      return next(createError('Font size must be between 8 and 144', 400, 'INVALID_FONT_SETTINGS'))
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return next(createError('Font color must be a valid hex color', 400, 'INVALID_FONT_SETTINGS'))
    }

    if (alignment && !['left', 'center', 'right'].includes(alignment)) {
      return next(createError('Alignment must be left, center, or right', 400, 'INVALID_FONT_SETTINGS'))
    }
  }

  next()
}

