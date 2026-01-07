import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { createError } from './errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB

// Storage configuration for PDF templates
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../../uploads/templates')
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `template_${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

// Storage configuration for Excel files
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../../uploads/excel')
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `excel_${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

// File filter for PDF files
const pdfFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(createError('Only PDF files are allowed', 400, 'INVALID_FILE_TYPE'))
  }
}

// File filter for Excel files
const excelFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]
  const allowedExtensions = ['.xlsx', '.xls']
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    cb(createError('Only Excel files (.xlsx, .xls) are allowed', 400, 'INVALID_FILE_TYPE'))
  }
}

export const uploadTemplate = multer({
  storage: templateStorage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('template')

export const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('excel')

