import { Router } from 'express'
import templateRoutes from './templateRoutes.js'
import participantRoutes from './participantRoutes.js'
import certificateRoutes from './certificateRoutes.js'

const router = Router()

router.use('/templates', templateRoutes)
router.use('/participants', participantRoutes)
router.use('/certificates', certificateRoutes)

export default router

