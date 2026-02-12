import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { useApp } from '../../contexts/AppContext'
import { v4 as uuidv4 } from '../../utils/uuid'
import { cn } from '../../lib/utils'
import { FileSpreadsheet, Upload, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

export default function ExcelUpload() {
  const { dispatch, state } = useApp()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const parseExcelFile = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setResult(null)

      try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const sheetName = workbook.SheetNames[0]

        if (!sheetName) {
          setResult({ success: 0, errors: ['Excel file has no sheets'] })
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          setResult({ success: 0, errors: ['Excel file is empty'] })
          return
        }

        // Check if first row looks like a header
        const isHeader = (row: any[]) => {
          if (!row || row.length === 0) return false
          const firstCell = String(row[0] || '').toLowerCase()
          const headerKeywords = ['name', 'participant', 'student', 'attendee', 'person', 'full name']
          return headerKeywords.some((keyword) => firstCell.includes(keyword))
        }

        const startIndex = isHeader(jsonData[0]) ? 1 : 0
        const existingNames = new Set(state.participants.map((p) => p.name.toLowerCase()))
        const newParticipants = []
        const errors: string[] = []

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i]
          const name = row?.[0]
          const email = row?.[1] // Second column (Column B)

          if (!name || String(name).trim().length === 0) {
            if (row && row.length > 0) {
              errors.push(`Row ${i + 1}: Empty name`)
            }
            continue
          }

          const trimmedName = String(name).trim()

          // Skip duplicates
          if (existingNames.has(trimmedName.toLowerCase())) {
            errors.push(`Row ${i + 1}: "${trimmedName}" is already in the list`)
            continue
          }

          // Validate name
          if (trimmedName.length < 2) {
            errors.push(`Row ${i + 1}: "${trimmedName}" is too short`)
            continue
          }

          if (trimmedName.length > 100) {
            errors.push(`Row ${i + 1}: "${trimmedName}" is too long`)
            continue
          }

          // Parse and validate email if provided
          let participantEmail: string | undefined
          if (email && typeof email === 'string') {
            const trimmedEmail = String(email).trim()
            if (trimmedEmail) {
              participantEmail = trimmedEmail
              // Basic email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (!emailRegex.test(trimmedEmail)) {
                errors.push(`Row ${i + 1}: Invalid email "${trimmedEmail}"`)
              }
            }
          }

          existingNames.add(trimmedName.toLowerCase())
          newParticipants.push({
            id: uuidv4(),
            name: trimmedName,
            email: participantEmail,
            status: 'pending' as const,
          })
        }

        if (newParticipants.length > 0) {
          dispatch({ type: 'ADD_PARTICIPANTS', payload: newParticipants })
        }

        setResult({
          success: newParticipants.length,
          errors: errors.slice(0, 5), // Limit displayed errors
        })
      } catch (error) {
        setResult({
          success: 0,
          errors: [error instanceof Error ? error.message : 'Failed to parse Excel file'],
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [dispatch, state.participants]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        parseExcelFile(file)
      }
    },
    [parseExcelFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'flex flex-col items-center justify-center text-center',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-white',
          isProcessing && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-600 font-medium">Processing Excel file...</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-medium text-slate-700 mb-1">
              {isDragActive ? 'Drop your Excel file here' : 'Drag & drop Excel file'}
            </p>
            <p className="text-sm text-slate-500 mb-3">or click to browse</p>
            <div className="px-3 py-1.5 bg-slate-100 rounded text-sm text-slate-600">
              .xlsx or .xls files
            </div>
          </>
        )}
      </div>

      {/* Expected Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Expected Format</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Names should be in the first column (Column A)</li>
          <li>• Email addresses in the second column (Column B) - optional</li>
          <li>• First row can be a header (it will be skipped if detected)</li>
          <li>• One participant per row</li>
        </ul>
      </div>

      {/* Result Feedback */}
      {result && (
        <div
          className={cn(
            'rounded-lg p-4',
            result.success > 0 && result.errors.length === 0
              ? 'bg-green-50 border border-green-200'
              : result.success > 0
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          )}
        >
          {result.success > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">
                Successfully added {result.success} participant(s)
              </span>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">Some issues found:</span>
              </div>
              <ul className="text-sm text-amber-700 ml-7 space-y-0.5">
                {result.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

