import { useApp } from '../../contexts/AppContext'
import { X, AlertCircle, User, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function ParticipantList() {
  const { state, dispatch } = useApp()

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: id })
  }

  const handleClearAll = () => {
    dispatch({ type: 'SET_PARTICIPANTS', payload: [] })
  }

  const validParticipants = state.participants.filter((p) => p.status !== 'error')
  const errorParticipants = state.participants.filter((p) => p.status === 'error')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {validParticipants.length} valid, {errorParticipants.length} with errors
        </span>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
        {state.participants.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p>No participants added yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {state.participants.map((participant, index) => (
              <li
                key={participant.id}
                className={cn(
                  'flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors',
                  participant.status === 'error' && 'bg-red-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-medium">
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      participant.status === 'error' ? 'text-red-700' : 'text-slate-800'
                    )}
                  >
                    {participant.name}
                  </span>
                  {participant.status === 'error' && participant.errorMessage && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {participant.errorMessage}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(participant.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove participant"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

