import { useState } from 'react'
import { Mail, AlertCircle, Info, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { EmailConfig } from '../../types'

interface EmailComposerProps {
  emailConfig: EmailConfig
  onConfigChange: (config: EmailConfig) => void
  onSendTest?: () => void
  isSendingTest?: boolean
}

export default function EmailComposer({
  emailConfig,
  onConfigChange,
  onSendTest,
  isSendingTest = false,
}: EmailComposerProps) {
  const [testEmail, setTestEmail] = useState('')
  const [showTestInput, setShowTestInput] = useState(false)

  const handleSubjectChange = (value: string) => {
    onConfigChange({ ...emailConfig, subject: value })
  }

  const handleBodyChange = (value: string) => {
    onConfigChange({ ...emailConfig, body: value })
  }

  const handleSendTest = () => {
    if (onSendTest && testEmail) {
      onSendTest()
    }
  }

  const templateVariables = [
    { var: '{name}', desc: "Student's name" },
    { var: '{email}', desc: "Student's email" },
    { var: '{date}', desc: 'Current date' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Email Configuration
        </h3>
        <p className="text-sm text-slate-600">
          Customize the email that will be sent with certificates
        </p>
      </div>

      {/* Template Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-2">Available Template Variables</p>
            <div className="flex flex-wrap gap-3">
              {templateVariables.map((tv) => (
                <div key={tv.var} className="flex items-center gap-1.5">
                  <code className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-mono text-blue-700">
                    {tv.var}
                  </code>
                  <span className="text-xs text-blue-600">{tv.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Input */}
      <div>
        <label htmlFor="email-subject" className="block text-sm font-medium text-slate-700 mb-2">
          Email Subject
        </label>
        <input
          id="email-subject"
          type="text"
          value={emailConfig.subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          placeholder="e.g., Your Certificate is Ready"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Body Textarea */}
      <div>
        <label htmlFor="email-body" className="block text-sm font-medium text-slate-700 mb-2">
          Email Body
        </label>
        <textarea
          id="email-body"
          value={emailConfig.body}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={8}
          placeholder="Dear {name},&#10;&#10;Please find attached your certificate.&#10;&#10;Best regards"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
        />
        <p className="mt-2 text-xs text-slate-500">
          Use template variables like {'{name}'} to personalize each email
        </p>
      </div>

      {/* Test Email Section */}
      <div className="border-t border-slate-200 pt-6">
        <button
          onClick={() => setShowTestInput(!showTestInput)}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Send Test Email
        </button>

        {showTestInput && (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="test-email" className="block text-sm font-medium text-slate-700 mb-2">
                Test Email Address
              </label>
              <div className="flex gap-2">
                <input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleSendTest}
                  disabled={!testEmail || isSendingTest}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                    testEmail && !isSendingTest
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {isSendingTest ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Test email will be sent without certificate attachment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
