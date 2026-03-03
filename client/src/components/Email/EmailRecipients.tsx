import { useState } from 'react'
import { Mail, CheckCircle, XCircle, AlertCircle, Trash2, Pencil, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useApp } from '../../contexts/AppContext'
import type { Participant } from '../../types'

interface EmailRecipientsProps {
  participants: Participant[]
  onRemove?: (id: string) => void
  showActions?: boolean
}

const validateEmail = (email: string | undefined): boolean => {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function EditableEmailCell({ participant }: { participant: Participant }) {
  const { dispatch } = useApp()
  const isValid = validateEmail(participant.email)
  // Always show input if no valid email; show display+edit button if valid
  const [editing, setEditing] = useState(!isValid)
  const [value, setValue] = useState(participant.email || '')

  const handleSave = () => {
    const trimmed = value.trim()
    dispatch({ type: 'UPDATE_PARTICIPANT_EMAIL', payload: { id: participant.id, email: trimmed } })
    if (validateEmail(trimmed)) setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape' && isValid) setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full">
        <input
          autoFocus
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="email@example.com"
          className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-700 flex-shrink-0" title="Save">
          <Check className="w-4 h-4" />
        </button>
        {isValid && (
          <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-red-500 flex-shrink-0" title="Cancel">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group w-full min-w-0">
      <span className="truncate text-sm text-slate-600">{participant.email}</span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all flex-shrink-0"
        title="Edit email"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function EmailRecipients({
  participants,
  onRemove,
  showActions = true,
}: EmailRecipientsProps) {
  const validCount = participants.filter((p) => validateEmail(p.email)).length
  const invalidCount = participants.filter((p) => !validateEmail(p.email)).length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Email Recipients
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-slate-600">
              {validCount} valid email{validCount !== 1 ? 's' : ''}
            </span>
          </div>
          {invalidCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">
                {invalidCount} missing/invalid email{invalidCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {invalidCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Missing Email Addresses</p>
              <p className="text-sm text-amber-700">
                Click on any row's email column to type an email address directly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-6">Email {invalidCount > 0 && <span className="text-amber-500 font-normal">(click to edit)</span>}</div>
            {showActions && onRemove && <div className="col-span-1"></div>}
          </div>
        </div>

        <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
          {participants.map((participant) => {
            const isValid = validateEmail(participant.email)
            return (
              <div
                key={participant.id}
                className={cn(
                  'grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-slate-50 transition-colors',
                  !isValid && 'bg-amber-50/30'
                )}
              >
                <div className="col-span-1 flex items-center">
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="col-span-4 flex items-center">
                  <span className="font-medium text-slate-800 truncate">{participant.name}</span>
                </div>
                <div className="col-span-6 flex items-center min-w-0">
                  <EditableEmailCell participant={participant} />
                </div>
                {showActions && onRemove && (
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      onClick={() => onRemove(participant.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {participants.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No participants added yet</p>
        </div>
      )}
    </div>
  )
}
