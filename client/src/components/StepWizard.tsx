import { useApp } from '../contexts/AppContext'
import { cn } from '../lib/utils'
import { Check } from 'lucide-react'
import TemplateUpload from './TemplateUpload/TemplateUploader'
import PositionMarker from './TemplateUpload/PositionMarker'
import ParticipantInput from './ParticipantInput/ParticipantInput'
import GenerateDownload from './CertificateGeneration/GenerateDownload'

const steps = [
  { id: 0, title: 'Upload Template', description: 'Upload your PDF certificate' },
  { id: 1, title: 'Mark Position', description: 'Set name placement and style' },
  { id: 2, title: 'Add Participants', description: 'Enter names for certificates' },
  { id: 3, title: 'Generate', description: 'Create and download certificates' },
]

export default function StepWizard() {
  const { state, dispatch } = useApp()
  const { currentStep } = state

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return state.template !== null
      case 1:
        return state.nameFieldPosition !== null
      case 2:
        return state.participants.length > 0
      case 3:
        return false
      default:
        return false
    }
  }

  const goToStep = (step: number) => {
    if (step < currentStep || canGoNext()) {
      dispatch({ type: 'SET_STEP', payload: step })
    }
  }

  const nextStep = () => {
    if (canGoNext() && currentStep < steps.length - 1) {
      dispatch({ type: 'SET_STEP', payload: currentStep + 1 })
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      dispatch({ type: 'SET_STEP', payload: currentStep - 1 })
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <TemplateUpload />
      case 1:
        return <PositionMarker />
      case 2:
        return <ParticipantInput />
      case 3:
        return <GenerateDownload />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn('relative', stepIdx !== steps.length - 1 && 'pr-8 sm:pr-20')}
            >
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-7 -ml-px mt-0.5 w-full h-0.5 sm:w-20"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-colors duration-300',
                      step.id < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                    )}
                  />
                </div>
              )}
              <button
                onClick={() => goToStep(step.id)}
                className="group relative flex flex-col items-center"
                disabled={step.id > currentStep && !canGoNext()}
              >
                <span className="flex h-9 items-center">
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
                      step.id < currentStep
                        ? 'bg-blue-600 text-white'
                        : step.id === currentStep
                        ? 'border-2 border-blue-600 bg-white text-blue-600'
                        : 'border-2 border-slate-300 bg-white text-slate-500'
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.id + 1}</span>
                    )}
                  </span>
                </span>
                <span className="mt-2 flex flex-col items-center">
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      step.id <= currentStep ? 'text-slate-900' : 'text-slate-500'
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-slate-500 hidden sm:block">{step.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
        <div className="p-6 sm:p-8">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={cn(
              'px-5 py-2.5 rounded-lg font-medium text-sm transition-all',
              currentStep === 0
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-200'
            )}
          >
            Back
          </button>
          {currentStep < steps.length - 1 && (
            <button
              onClick={nextStep}
              disabled={!canGoNext()}
              className={cn(
                'px-5 py-2.5 rounded-lg font-medium text-sm transition-all',
                canGoNext()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

