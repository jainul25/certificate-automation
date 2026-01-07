import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { cn } from '../../lib/utils'
import { Users, FileSpreadsheet } from 'lucide-react'
import ManualInput from './ManualInput'
import ExcelUpload from './ExcelUpload'
import ParticipantList from './ParticipantList'

export default function ParticipantInput() {
  const { state } = useApp()
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Add Participants</h2>
        <p className="text-slate-600">Enter participant names manually or upload an Excel file with names in the first column.</p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all',
            activeTab === 'manual'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          )}
        >
          <Users className="w-4 h-4" />
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all',
            activeTab === 'excel'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          )}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel Upload
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-slate-50 rounded-xl p-6">
        {activeTab === 'manual' ? <ManualInput /> : <ExcelUpload />}
      </div>

      {/* Participant List */}
      {state.participants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">
              Participants ({state.participants.filter((p) => p.status !== 'error').length})
            </h3>
          </div>
          <ParticipantList />
        </div>
      )}

      {state.participants.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-green-800 font-medium">
            {state.participants.filter((p) => p.status !== 'error').length} participant(s) ready. Click "Continue" to generate certificates.
          </p>
        </div>
      )}
    </div>
  )
}

