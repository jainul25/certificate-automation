import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Loader2, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../services/api'
import { cn } from '../../lib/utils'

export default function TemplateUploader() {
  const { state, dispatch } = useApp()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setIsUploading(true)
      setError(null)

      try {
        const response = await api.uploadTemplate(file)

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)

        dispatch({
          type: 'SET_TEMPLATE_FILE',
          payload: { file, previewUrl },
        })

        dispatch({
          type: 'SET_TEMPLATE',
          payload: {
            id: response.templateId,
            name: file.name.replace(/\.pdf$/i, ''),
            filename: file.name,
            filePath: response.previewUrl,
            nameFieldPosition: { x: 0, y: 0, width: 200, height: 50, page: 0 },
            fontSettings: {
              family: 'Helvetica',
              size: 36,
              color: '#000000',
              alignment: 'center',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload template')
      } finally {
        setIsUploading(false)
      }
    },
    [dispatch]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  const clearTemplate = () => {
    if (state.templatePreviewUrl) {
      URL.revokeObjectURL(state.templatePreviewUrl)
    }
    dispatch({ type: 'RESET' })
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Upload Certificate Template</h2>
        <p className="text-slate-600">Upload a PDF certificate template. You'll mark where the participant name should appear in the next step.</p>
      </div>

      {!state.template ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer',
            'flex flex-col items-center justify-center text-center',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-slate-600 font-medium">Uploading template...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-1">
                {isDragActive ? 'Drop your PDF here' : 'Drag & drop your certificate PDF'}
              </p>
              <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600">
                PDF files only • Max 10MB
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{state.template.name}.pdf</p>
                <p className="text-sm text-slate-500">Template uploaded successfully</p>
              </div>
            </div>
            <button
              onClick={clearTemplate}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Remove template"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {state.templatePreviewUrl && (
            <div className="p-4 bg-slate-100">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden max-h-[400px] flex items-center justify-center">
                <object
                  data={state.templatePreviewUrl}
                  type="application/pdf"
                  className="w-full h-[400px]"
                >
                  <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                    <FileText className="w-12 h-12 mb-3 text-slate-400" />
                    <p>PDF preview not available in your browser</p>
                    <p className="text-sm">The template has been uploaded successfully</p>
                  </div>
                </object>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {state.template && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-green-800 font-medium">
            Template ready! Click "Continue" to mark where the participant name should appear.
          </p>
        </div>
      )}
    </div>
  )
}

