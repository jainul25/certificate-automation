import { Router } from 'express'
import * as templateController from '../controllers/templateController.js'
import { uploadTemplate } from '../middleware/upload.js'
import { validatePosition } from '../middleware/validation.js'

const router = Router()

// Upload a new PDF template
router.post('/upload', uploadTemplate, templateController.upload)

// Save name position and font settings for a template
router.post('/:id/position', validatePosition, templateController.savePosition)

// Get template by ID
router.get('/:id', templateController.getTemplate)

// Get all templates
router.get('/', templateController.getAllTemplates)

export default router

