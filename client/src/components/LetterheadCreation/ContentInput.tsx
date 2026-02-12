import React from 'react'
import { Edit3, Upload } from 'lucide-react'
import { useLetterhead } from '../../contexts/LetterheadContext'
import ContentEditor from './ContentEditor'
import ContentUpload from './ContentUpload'

export default function ContentInput() {
  const { state, dispatch } = useLetterhead()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Add Content</h2>
        <p className="text-slate-600">
          Choose how you want to add content to your letterhead
        </p>
      </div>

      {/* Toggle between editor and upload */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => dispatch({ type: 'SET_CONTENT_SOURCE', payload: 'editor' })}
          className={`
            px-6 py-2.5 rounded-md font-medium transition-all duration-200 flex items-center gap-2
            ${state.contentSource === 'editor'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <Edit3 className="w-4 h-4" />
          Text Editor
        </button>
        
        <button
          onClick={() => dispatch({ type: 'SET_CONTENT_SOURCE', payload: 'upload' })}
          className={`
            px-6 py-2.5 rounded-md font-medium transition-all duration-200 flex items-center gap-2
            ${state.contentSource === 'upload'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
      </div>

      {/* Content input area */}
      <div>
        {state.contentSource === 'editor' ? (
          <ContentEditor />
        ) : (
          <ContentUpload />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 0 })}
          className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium"
        >
          Back
        </button>
        
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 2 })}
          disabled={
            state.contentSource === 'editor'
              ? !state.editorContent || state.editorContent.trim() === ''
              : !state.contentFile
          }
          className={`
            px-6 py-2.5 rounded-lg font-medium transition-all duration-200
            ${state.contentSource === 'editor'
              ? state.editorContent && state.editorContent.trim() !== ''
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : state.contentFile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
