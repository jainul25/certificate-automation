import { Router } from 'express'
import * as participantController from '../controllers/participantController.js'
import { uploadExcel } from '../middleware/upload.js'

const router = Router()

// Parse manually entered names
router.post('/manual', participantController.parseManual)

// Parse names from Excel file
router.post('/excel', uploadExcel, participantController.parseExcel)

export default router

