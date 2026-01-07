import { Router } from 'express'
import * as certificateController from '../controllers/certificateController.js'

const router = Router()

// Generate certificates
router.post('/generate', certificateController.generate)

// Get generation session status
router.get('/session/:sessionId/status', certificateController.getSessionStatus)

// Download generated certificates as ZIP
router.get('/session/:sessionId/download', certificateController.downloadSession)

// Preview a single certificate
router.post('/preview', certificateController.preview)

export default router

