import React from 'react'
import { useLetterhead } from '../../contexts/LetterheadContext'
import TemplateUpload from './TemplateUpload'
import ContentInput from './ContentInput'
import PreviewDownload from './PreviewDownload'

const steps = [
  { id: 0, name: 'Upload Template', description: 'Upload your letterhead' },
  { id: 1, name: 'Add Content', description: 'Add your content' },
  { id: 2, name: 'Generate', description: 'Download your document' },
]

export default function LetterheadWizard() {
  const { state } = useLetterhead()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    transition-all duration-300
                    ${state.currentStep === step.id
                      ? 'bg-blue-600 text-white scale-110'
                      : state.currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }
                  `}
                >
                  {state.currentStep > step.id ? '✓' : step.id + 1}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-sm font-medium
                      ${state.currentStep === step.id
                        ? 'text-blue-600'
                        : state.currentStep > step.id
                          ? 'text-green-600'
                          : 'text-slate-500'
                      }
                    `}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-4 rounded-full transition-all duration-300
                    ${state.currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'}
                  `}
                  style={{ maxWidth: '120px', marginTop: '-40px' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        {state.currentStep === 0 && <TemplateUpload />}
        {state.currentStep === 1 && <ContentInput />}
        {state.currentStep === 2 && <PreviewDownload />}
      </div>
    </div>
  )
}
