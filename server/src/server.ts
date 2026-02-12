import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Create upload and output directories
// Use /tmp on Vercel (read-only filesystem except /tmp)
const isVercel = !!process.env.VERCEL
const uploadDir = isVercel
  ? path.join('/tmp', 'uploads')
  : path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads')
const outputDir = isVercel
  ? path.join('/tmp', 'outputs')
  : path.resolve(__dirname, '..', process.env.OUTPUT_DIR || './outputs')

// Create necessary directories
const directories = [
  uploadDir,
  outputDir,
  path.join(uploadDir, 'templates'),
  path.join(uploadDir, 'excel'),
  path.join(uploadDir, 'letterheads', 'templates'),
  path.join(uploadDir, 'letterheads', 'content'),
  path.join(uploadDir, 'letterheads', 'generated'),
]

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Middleware
app.use(cors({
  origin: process.env.VERCEL
    ? true  // Allow same-origin on Vercel
    : process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(uploadDir))
app.use('/outputs', express.static(outputDir))

// API Routes
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

// Start server (only when running locally, not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📁 Upload directory: ${uploadDir}`)
    console.log(`📁 Output directory: ${outputDir}`)
  })
}

export default app

