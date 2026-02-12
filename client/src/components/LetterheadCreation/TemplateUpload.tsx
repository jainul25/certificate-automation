import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, FileText, Upload } from 'lucide-react'
import { useLetterhead } from '../../contexts/LetterheadContext'
import { api } from '../../services/api'
import { showToast } from '../common/Toast'

export default function TemplateUpload() {
  const { state, dispatch } = useLetterhead()
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsUploading(true)

    try {
      const result = await api.uploadLetterheadTemplate(file)
      
      dispatch({
        type: 'SET_TEMPLATE',
        payload: {
          template: {
            id: result.templateId,
            filename: result.filename,
            originalName: result.originalName,
            fileType: result.fileType as 'pdf' | 'docx',
            previewUrl: result.previewUrl,
          },
          file,
        },
      })

      showToast('Letterhead template uploaded successfully!', 'success')
      dispatch({ type: 'SET_STEP', payload: 1 })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload template', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Upload Letterhead Template</h2>
        <p className="text-slate-600">
          Upload your company's letterhead as a PDF or DOCX file
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-slate-600">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              
              {isDragActive ? (
                <p className="text-lg text-blue-600 font-medium">Drop your letterhead here</p>
              ) : (
                <>
                  <p className="text-lg text-slate-700">
                    Drag and drop your letterhead here
                  </p>
                  <p className="text-sm text-slate-500">or click to browse files</p>
                </>
              )}
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>PDF or DOCX</span>
                </div>
                <span>•</span>
                <span>Max 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {state.template && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <FileUp className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Template uploaded</p>
            <p className="text-sm text-green-700">{state.template.originalName}</p>
          </div>
        </div>
      )}
    </div>
  )
}
