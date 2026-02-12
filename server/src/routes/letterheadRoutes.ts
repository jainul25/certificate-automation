import { Router } from 'express'
import * as letterheadController from '../controllers/letterheadController.js'
import { uploadLetterheadTemplate, uploadLetterheadContent } from '../middleware/upload.js'

const router = Router()

// Upload letterhead template (PDF or DOCX)
router.post('/upload-template', uploadLetterheadTemplate, letterheadController.uploadTemplate)

// Upload content file (DOCX)
router.post('/upload-content', uploadLetterheadContent, letterheadController.uploadContent)

// Generate merged document
router.post('/generate', letterheadController.generate)

// Get document by ID
router.get('/:id', letterheadController.getDocument)

// Download document
router.get('/:id/download', letterheadController.download)

export default router
