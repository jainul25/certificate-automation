import { useState, useEffect, useCallback } from 'react'
import { api } from '../../services/api'
import { cn } from '../../lib/utils'
import {
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  RefreshCw,
  Send,
} from 'lucide-react'
import type { EmailParticipant } from '../../types'

interface EmailSendingProps {
  sessionId: string | null
  onReset?: () => void
}

export default function EmailSending({ sessionId, onReset }: EmailSendingProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')
  const [sentCount, setSentCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [participants, setParticipants] = useState<EmailParticipant[]>([])
  const [showDetails, setShowDetails] = useState(false)

  const pollStatus = useCallback(async (sid: string) => {
    try {
      const statusData = await api.getEmailSessionStatus(sid)
      setProgress(statusData.progress)
      setSentCount(statusData.sentCount)
      setFailedCount(statusData.failedCount)
      setTotalCount(statusData.totalCount)
      setParticipants(statusData.participants)

      if (statusData.status === 'completed') {
        setStatus('completed')
        return true
      } else if (statusData.status === 'failed') {
        setStatus('failed')
        return true
      } else if (statusData.status === 'processing') {
        setStatus('processing')
      }
      return false
    } catch (err) {
      console.error('Status poll error:', err)
      return false
    }
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (sessionId && (status === 'idle' || status === 'processing')) {
      // Initial poll
      pollStatus(sessionId)

      // Set up interval
      intervalId = setInterval(async () => {
        const done = await pollStatus(sessionId)
        if (done) {
          clearInterval(intervalId)
        }
      }, 1500)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [sessionId, status, pollStatus])

  if (!sessionId) {
    return null
  }

  const failedParticipants = participants.filter((p) => p.status === 'failed')
  const sentParticipants = participants.filter((p) => p.status === 'sent')

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div
        className={cn(
          'rounded-xl p-6 border',
          status === 'processing' && 'bg-blue-50 border-blue-200',
          status === 'completed' && 'bg-green-50 border-green-200',
          status === 'failed' && 'bg-red-50 border-red-200'
        )}
      >
        {/* Processing State */}
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium text-blue-800">Sending emails...</p>
                <p className="text-sm text-blue-600">
                  {sentCount + failedCount} of {totalCount} processed
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-blue-600">
                <span>{sentCount} sent</span>
                {failedCount > 0 && <span>{failedCount} failed</span>}
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Completed State */}
        {status === 'completed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-medium text-green-800">Emails Sent Successfully!</p>
                <p className="text-sm text-green-600">
                  {sentCount} email{sentCount !== 1 ? 's' : ''} sent
                  {failedCount > 0 && `, ${failedCount} failed`}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">Successfully Sent</p>
                    <p className="text-lg font-bold text-green-800">{sentCount}</p>
                  </div>
                </div>
              </div>

              {failedCount > 0 && (
                <div className="bg-white border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-xs text-red-600 font-medium">Failed</p>
                      <p className="text-lg font-bold text-red-800">{failedCount}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Show Details Toggle */}
            {failedCount > 0 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                {showDetails ? 'Hide' : 'Show'} failed emails
              </button>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-green-300 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Send More Emails
              </button>
            </div>
          </div>
        )}

        {/* Failed State */}
        {status === 'failed' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Email Sending Failed</p>
                <p className="text-sm text-red-600">
                  An error occurred while sending emails. Please check your email configuration.
                </p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Failed Emails Details */}
      {showDetails && failedCount > 0 && (
        <div className="border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-2 border-b border-red-200">
            <h4 className="font-medium text-red-800 text-sm">Failed Emails ({failedCount})</h4>
          </div>
          <div className="divide-y divide-red-100 max-h-[300px] overflow-y-auto bg-white">
            {failedParticipants.map((participant) => (
              <div key={participant.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{participant.name}</p>
                    <p className="text-sm text-slate-600 truncate">{participant.email}</p>
                    {participant.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{participant.errorMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
