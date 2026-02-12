import React, { useState, useEffect } from 'react'
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useLetterhead } from '../../contexts/LetterheadContext'
import { api } from '../../services/api'
import { showToast } from '../common/Toast'

export default function PreviewDownload() {
  const { state, dispatch } = useLetterhead()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!state.generatedDocument && state.template) {
      generateDocument()
    }
  }, [])

  const generateDocument = async () => {
    if (!state.template) return

    setIsGenerating(true)
    setProgress(10)

    try {
      let contentFilePath: string | undefined
      
      // Upload content file if using upload mode
      if (state.contentSource === 'upload' && state.contentFile) {
        setProgress(30)
        const uploadResult = await api.uploadLetterheadContent(state.contentFile)
        contentFilePath = uploadResult.filePath
      }

      setProgress(50)

      // Generate the document
      const result = await api.generateLetterhead(
        state.template.id,
        state.contentSource,
        state.contentSource === 'editor' ? state.editorContent : undefined,
        contentFilePath,
        state.outputFormat
      )

      setProgress(70)

      // Poll for completion
      const checkStatus = async () => {
        const doc = await api.getLetterheadDocument(result.sessionId)
        
        if (doc.status === 'completed') {
          setProgress(100)
          dispatch({ type: 'SET_GENERATED_DOCUMENT', payload: doc })
          showToast('Document generated successfully!', 'success')
          setIsGenerating(false)
        } else if (doc.status === 'failed') {
          throw new Error(doc.error || 'Failed to generate document')
        } else {
          // Still processing, check again
          setTimeout(checkStatus, 1000)
        }
      }

      setTimeout(checkStatus, 1000)
    } catch (error) {
      setIsGenerating(false)
      showToast(error instanceof Error ? error.message : 'Failed to generate document', 'error')
    }
  }

  const handleDownload = () => {
    if (state.generatedDocument) {
      const downloadUrl = api.getLetterheadDownloadUrl(state.generatedDocument.id)
      window.location.href = downloadUrl
    }
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Generate & Download</h2>
        <p className="text-slate-600">
          Your letterhead document is being generated
        </p>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Template:</span>
            <span className="font-medium text-slate-900">{state.template?.originalName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-600">Template Type:</span>
            <span className="font-medium text-slate-900 uppercase">{state.template?.fileType}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-600">Content Source:</span>
            <span className="font-medium text-slate-900">
              {state.contentSource === 'editor' ? 'Text Editor' : 'Uploaded File'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-600">Output Format:</span>
            <span className="font-medium text-slate-900 uppercase">{state.outputFormat}</span>
          </div>
        </div>
      </div>

      {/* Output format selector */}
      {!state.generatedDocument && !isGenerating && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Output Format</label>
          <div className="flex gap-3">
            <button
              onClick={() => dispatch({ type: 'SET_OUTPUT_FORMAT', payload: 'pdf' })}
              className={`
                flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
                ${state.outputFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-300 hover:border-slate-400'
                }
              `}
            >
              <div className="font-medium">PDF</div>
              <div className="text-xs text-slate-600">Portable Document Format</div>
            </button>
            
            <button
              onClick={() => dispatch({ type: 'SET_OUTPUT_FORMAT', payload: 'docx' })}
              className={`
                flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
                ${state.outputFormat === 'docx'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-300 hover:border-slate-400'
                }
              `}
            >
              <div className="font-medium">DOCX</div>
              <div className="text-xs text-slate-600">Microsoft Word Document</div>
            </button>
          </div>
        </div>
      )}

      {/* Generation progress */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="font-medium text-blue-900">Generating your document...</span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-blue-700 mt-2">{progress}% complete</p>
        </div>
      )}

      {/* Success state */}
      {state.generatedDocument?.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900 mb-1">Document ready!</p>
              <p className="text-sm text-green-700">
                Your letterhead document has been generated successfully.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            className="mt-4 w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Document
          </button>
        </div>
      )}

      {/* Error state */}
      {state.generatedDocument?.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 mb-1">Generation failed</p>
              <p className="text-sm text-red-700">
                {state.generatedDocument.error || 'An error occurred while generating your document.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 1 })}
          disabled={isGenerating}
          className={`
            px-6 py-2.5 font-medium transition-all duration-200
            ${isGenerating
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          Back
        </button>
        
        {state.generatedDocument?.status === 'completed' && (
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
          >
            Create Another
          </button>
        )}
      </div>
    </div>
  )
}
