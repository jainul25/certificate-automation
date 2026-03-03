import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { v4 as uuidv4 } from '../../utils/uuid'
import { UserPlus, AlertCircle, Info } from 'lucide-react'

export default function ManualInput() {
  const { dispatch, state } = useApp()
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validateName = (name: string): { valid: boolean; error?: string } => {
    if (name.length < 2) return { valid: false, error: 'Name must be at least 2 characters' }
    if (name.length > 100) return { valid: false, error: 'Name must be at most 100 characters' }
    if (!/^[\p{L}\s\-'.]+$/u.test(name)) return { valid: false, error: 'Name contains invalid characters' }
    return { valid: true }
  }

  // Parse each line as "Name" or "Name, Email"
  const parseLines = (text: string) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const commaIdx = line.lastIndexOf(',')
        if (commaIdx !== -1) {
          const possibleEmail = line.slice(commaIdx + 1).trim()
          if (validateEmail(possibleEmail)) {
            return { name: line.slice(0, commaIdx).trim(), email: possibleEmail }
          }
        }
        return { name: line.trim(), email: '' }
      })
  }

  const handleAddParticipants = () => {
    setError(null)
    const parsed = parseLines(inputText)

    if (parsed.length === 0) {
      setError('Please enter at least one name')
      return
    }

    const existingNames = new Set(state.participants.map((p) => p.name.toLowerCase()))
    const newParticipants = []
    const errors: string[] = []

    for (const { name, email } of parsed) {
      if (existingNames.has(name.toLowerCase())) {
        errors.push(`"${name}" is already in the list`)
        continue
      }
      const validation = validateName(name)
      if (!validation.valid) {
        errors.push(`"${name}": ${validation.error}`)
        continue
      }
      existingNames.add(name.toLowerCase())
      newParticipants.push({
        id: uuidv4(),
        name,
        email: email || undefined,
        status: 'pending' as const,
      })
    }

    if (newParticipants.length > 0) {
      dispatch({ type: 'ADD_PARTICIPANTS', payload: newParticipants })
      setInputText('')
    }

    if (errors.length > 0) {
      setError(errors.join('; '))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) handleAddParticipants()
  }

  const parsed = parseLines(inputText)
  const withEmail = parsed.filter((p) => p.email).length
  const withoutEmail = parsed.filter((p) => !p.email).length

  return (
    <div className="space-y-4">
      {/* Format hint */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Format: one participant per line</p>
          <p className="font-mono text-xs text-blue-600">
            John Doe, john@example.com<br />
            Jane Smith, jane@example.com<br />
            Bob Wilson&nbsp;&nbsp;<span className="text-blue-400">(email optional)</span>
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Enter Participants
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`John Doe, john@example.com\nJane Smith, jane@example.com\nBob Wilson`}
          className="w-full h-44 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
        />
        <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
          <span>One participant per line · Email is optional</span>
          {parsed.length > 0 && (
            <span>
              {parsed.length} detected
              {withEmail > 0 && <span className="text-green-600 ml-1">· {withEmail} with email</span>}
              {withoutEmail > 0 && <span className="text-amber-500 ml-1">· {withoutEmail} without</span>}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleAddParticipants}
        disabled={inputText.trim().length === 0}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        <UserPlus className="w-5 h-5" />
        Add Participants
      </button>

      <p className="text-xs text-slate-500">Tip: Press Ctrl+Enter to add quickly</p>
    </div>
  )
}
