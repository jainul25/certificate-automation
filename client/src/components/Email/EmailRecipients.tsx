import { Mail, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Participant } from '../../types'

interface EmailRecipientsProps {
  participants: Participant[]
  onRemove?: (id: string) => void
  showActions?: boolean
}

export default function EmailRecipients({
  participants,
  onRemove,
  showActions = true,
}: EmailRecipientsProps) {
  const validateEmail = (email: string | undefined): boolean => {
    if (!email) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validCount = participants.filter((p) => p.email && validateEmail(p.email)).length
  const invalidCount = participants.filter((p) => !p.email || !validateEmail(p.email)).length

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

      {/* Warning for missing emails */}
      {invalidCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Missing Email Addresses</p>
              <p className="text-sm text-amber-700">
                {invalidCount} participant{invalidCount !== 1 ? 's' : ''} will be skipped because{' '}
                {invalidCount !== 1 ? 'they have' : 'it has'} no valid email address. Make sure your
                Excel file has emails in Column B.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-6">Email</div>
            {showActions && onRemove && <div className="col-span-1">Action</div>}
          </div>
        </div>

        <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
          {participants.map((participant) => {
            const isValid = validateEmail(participant.email)
            return (
              <div
                key={participant.id}
                className={cn(
                  'grid grid-cols-12 gap-4 px-4 py-3 text-sm',
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
                <div className="col-span-6 flex items-center">
                  {participant.email ? (
                    <span
                      className={cn(
                        'truncate',
                        isValid ? 'text-slate-600' : 'text-amber-600 font-medium'
                      )}
                    >
                      {participant.email}
                    </span>
                  ) : (
                    <span className="text-amber-600 italic">No email provided</span>
                  )}
                </div>
                {showActions && onRemove && (
                  <div className="col-span-1 flex items-center">
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
