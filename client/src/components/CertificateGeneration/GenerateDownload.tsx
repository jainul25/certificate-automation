import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../services/api'
import { cn } from '../../lib/utils'
import { showToast } from '../common/Toast'
import {
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Sparkles,
  RefreshCw,
  Mail,
} from 'lucide-react'
import EmailComposer from '../Email/EmailComposer'
import EmailRecipients from '../Email/EmailRecipients'
import EmailSending from '../Email/EmailSending'

export default function GenerateDownload() {
  const { state, dispatch } = useApp()
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download')
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [emailSessionId, setEmailSessionId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [emailConfigured, setEmailConfigured] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(true)

  const validParticipants = state.participants.filter((p) => p.status !== 'error')
  const participantsWithEmail = validParticipants.filter((p) => p.email)

  // Check email configuration on mount
  useEffect(() => {
    const checkEmail = async () => {
      try {
        const result = await api.checkEmailConfig()
        setEmailConfigured(result.configured && result.connected)
      } catch (err) {
        console.error('Failed to check email config:', err)
        setEmailConfigured(false)
      } finally {
        setCheckingEmail(false)
      }
    }
    checkEmail()
  }, [])

  const pollStatus = useCallback(async (sid: string) => {
    try {
      const statusData = await api.getSessionStatus(sid)
      setProgress(statusData.progress)
      setCompletedCount(statusData.completedCount)
      setErrorCount(statusData.errorCount)

      if (statusData.status === 'completed') {
        setStatus('completed')
        return true
      } else if (statusData.status === 'failed') {
        setStatus('failed')
        setError('Generation failed. Please try again.')
        return true
      }
      return false
    } catch (err) {
      console.error('Status poll error:', err)
      return false
    }
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (sessionId && status === 'generating') {
      intervalId = setInterval(async () => {
        const done = await pollStatus(sessionId)
        if (done) {
          clearInterval(intervalId)
        }
      }, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [sessionId, status, pollStatus])

  const handleGenerate = async () => {
    if (!state.template || validParticipants.length === 0) return

    setIsGenerating(true)
    setError(null)
    setStatus('generating')
    setProgress(0)
    setCompletedCount(0)
    setErrorCount(0)

    try {
      const response = await api.generateCertificates(
        state.template.id,
        validParticipants.map((p) => ({ id: p.id, name: p.name }))
      )

      setSessionId(response.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation')
      setStatus('failed')
      setIsGenerating(false)
    }
  }

  const handleSendEmails = async () => {
    if (!state.template || participantsWithEmail.length === 0) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await api.sendBulkEmails(
        state.template.id,
        participantsWithEmail.map((p) => ({ id: p.id, name: p.name, email: p.email! })),
        state.emailConfig
      )

      setEmailSessionId(response.sessionId)
      showToast(`Sending emails to ${response.validCount} participants...`, 'success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send emails'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setIsGenerating(false)
    }
  }

  const handleSendTest = async () => {
    try {
      await api.sendTestEmail('test@example.com', state.emailConfig)
      showToast('Test email sent successfully!', 'success')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send test email'
      showToast(errorMsg, 'error')
    }
  }

  const handleDownload = () => {
    if (!sessionId) return

    const downloadUrl = api.getDownloadUrl(sessionId)
    window.open(downloadUrl, '_blank')
  }

  const handleReset = () => {
    setSessionId(null)
    setEmailSessionId(null)
    setProgress(0)
    setStatus('idle')
    setError(null)
    setCompletedCount(0)
    setErrorCount(0)
    setIsGenerating(false)
  }

  const handleEmailConfigChange = (config: any) => {
    dispatch({ type: 'SET_EMAIL_CONFIG', payload: config })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
          {deliveryMethod === 'download' ? 'Generate Certificates' : 'Send Certificates via Email'}
        </h2>
        <p className="text-slate-600">
          {deliveryMethod === 'download'
            ? 'Review your settings and generate certificates for all participants.'
            : 'Configure email settings and send certificates to participants.'}
        </p>
      </div>

      {/* Delivery Method Selector */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setDeliveryMethod('download')}
          className={cn(
            'px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2',
            deliveryMethod === 'download'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Download className="w-4 h-4" />
          Download ZIP
        </button>

        <button
          onClick={() => setDeliveryMethod('email')}
          disabled={checkingEmail}
          className={cn(
            'px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2',
            deliveryMethod === 'email'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900',
            checkingEmail && 'opacity-50 cursor-wait'
          )}
        >
          <Mail className="w-4 h-4" />
          Email Delivery
        </button>
      </div>

      {/* Email Configuration Warning */}
      {deliveryMethod === 'email' && !checkingEmail && !emailConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">
                Email Service Not Configured
              </p>
              <p className="text-sm text-amber-700">
                Please configure SMTP settings in your server environment variables to use email
                delivery.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Download Method */}
      {deliveryMethod === 'download' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Template</p>
                  <p className="text-slate-800 font-semibold truncate max-w-[150px]">
                    {state.template?.name || 'Not selected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Participants</p>
                  <p className="text-slate-800 font-semibold">{validParticipants.length} names</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Font</p>
                  <p className="text-slate-800 font-semibold">
                    {state.fontSettings.family} {state.fontSettings.size}px
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Preview */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-medium text-slate-800 mb-3">Participants Preview</h3>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
              {validParticipants.slice(0, 20).map((participant) => (
                <span
                  key={participant.id}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700"
                >
                  {participant.name}
                </span>
              ))}
              {validParticipants.length > 20 && (
                <span className="px-3 py-1 bg-slate-200 rounded-full text-sm text-slate-600">
                  +{validParticipants.length - 20} more
                </span>
              )}
            </div>
          </div>

          {/* Generation Status */}
          {status !== 'idle' && (
            <div
              className={cn(
                'rounded-xl p-6',
                status === 'generating' && 'bg-blue-50 border border-blue-200',
                status === 'completed' && 'bg-green-50 border border-green-200',
                status === 'failed' && 'bg-red-50 border border-red-200'
              )}
            >
              {status === 'generating' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <div>
                      <p className="font-medium text-blue-800">Generating certificates...</p>
                      <p className="text-sm text-blue-600">
                        {completedCount} of {validParticipants.length} completed
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {status === 'completed' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800">Generation Complete!</p>
                      <p className="text-sm text-green-600">
                        {completedCount} certificates generated successfully
                        {errorCount > 0 && `, ${errorCount} failed`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
                    >
                      <Download className="w-5 h-5" />
                      Download All Certificates (ZIP)
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Generate Again
                    </button>
                  </div>
                </div>
              )}

              {status === 'failed' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <p className="font-medium text-red-800">Generation Failed</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          {status === 'idle' && (
            <button
              onClick={handleGenerate}
              disabled={!state.template || validParticipants.length === 0 || isGenerating}
              className={cn(
                'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
                state.template && validParticipants.length > 0 && !isGenerating
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Starting generation...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate {validParticipants.length} Certificate
                  {validParticipants.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* Email Method */}
      {deliveryMethod === 'email' && emailConfigured && (
        <>
          {/* Email Recipients */}
          <EmailRecipients participants={validParticipants} showActions={false} />

          {participantsWithEmail.length > 0 && (
            <>
              {/* Email Composer */}
              <EmailComposer
                emailConfig={state.emailConfig}
                onConfigChange={handleEmailConfigChange}
                onSendTest={handleSendTest}
              />

              {/* Email Sending Status */}
              {emailSessionId ? (
                <EmailSending sessionId={emailSessionId} onReset={handleReset} />
              ) : (
                /* Send Email Button */
                <button
                  onClick={handleSendEmails}
                  disabled={isGenerating || participantsWithEmail.length === 0}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
                    !isGenerating && participantsWithEmail.length > 0
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Preparing to send...
                    </>
                  ) : (
                    <>
                      <Mail className="w-6 h-6" />
                      Send {participantsWithEmail.length} Email
                      {participantsWithEmail.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </>
      )}

      {error && status === 'idle' && !emailSessionId && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

