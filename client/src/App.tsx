import { useState } from 'react'
import { AppProvider } from './contexts/AppContext'
import { LetterheadProvider } from './contexts/LetterheadContext'
import StepWizard from './components/StepWizard'
import LetterheadWizard from './components/LetterheadCreation/LetterheadWizard'
import { ToastContainer } from './components/common/Toast'
import { Award, FileText } from 'lucide-react'

type WorkflowMode = 'certificates' | 'letterhead'

function App() {
  const [mode, setMode] = useState<WorkflowMode>('certificates')

  return (
    <AppProvider>
      <LetterheadProvider>
        <ToastContainer />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="14" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="m9 16 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-slate-800">Document Automation</h1>
                    <p className="text-sm text-slate-500">Create certificates and letterhead documents</p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setMode('certificates')}
                    className={`
                      px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2
                      ${mode === 'certificates'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }
                    `}
                  >
                    <Award className="w-4 h-4" />
                    Certificates
                  </button>
                  
                  <button
                    onClick={() => setMode('letterhead')}
                    className={`
                      px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2
                      ${mode === 'letterhead'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                      }
                    `}
                  >
                    <FileText className="w-4 h-4" />
                    Letterhead
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-6 py-8">
            {mode === 'certificates' ? <StepWizard /> : <LetterheadWizard />}
          </main>
        </div>
      </LetterheadProvider>
    </AppProvider>
  )
}

export default App

