import { Router } from 'express'
import templateRoutes from './templateRoutes.js'
import participantRoutes from './participantRoutes.js'
import certificateRoutes from './certificateRoutes.js'
import letterheadRoutes from './letterheadRoutes.js'
import emailRoutes from './emailRoutes.js'

const router = Router()

router.use('/templates', templateRoutes)
router.use('/participants', participantRoutes)
router.use('/certificates', certificateRoutes)
router.use('/letterhead', letterheadRoutes)
router.use('/email', emailRoutes)

export default router

