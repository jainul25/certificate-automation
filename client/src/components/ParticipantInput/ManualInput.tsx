import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { v4 as uuidv4 } from '../../utils/uuid'
import { UserPlus, AlertCircle } from 'lucide-react'

export default function ManualInput() {
  const { dispatch, state } = useApp()
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const parseNames = (text: string): string[] => {
    // Split by comma or newline
    const names = text
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    return names
  }

  const validateName = (name: string): { valid: boolean; error?: string } => {
    if (name.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' }
    }
    if (name.length > 100) {
      return { valid: false, error: 'Name must be at most 100 characters' }
    }
    // Allow letters (including international), spaces, hyphens, apostrophes, periods
    const validPattern = /^[\p{L}\s\-'.]+$/u
    if (!validPattern.test(name)) {
      return { valid: false, error: 'Name contains invalid characters' }
    }
    return { valid: true }
  }

  const handleAddNames = () => {
    setError(null)

    const names = parseNames(inputText)

    if (names.length === 0) {
      setError('Please enter at least one name')
      return
    }

    // Check for existing names (case-insensitive)
    const existingNames = new Set(state.participants.map((p) => p.name.toLowerCase()))
    const newParticipants = []
    const errors: string[] = []

    for (const name of names) {
      // Skip duplicates
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
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddNames()
    }
  }

  const nameCount = parseNames(inputText).length

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Enter Names
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Enter names separated by commas or new lines:\n\nJohn Doe, Jane Smith\nAlice Brown\nBob Wilson`}
          className="w-full h-40 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
          <span>Separate names with commas or new lines</span>
          {nameCount > 0 && <span>{nameCount} name(s) detected</span>}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleAddNames}
        disabled={inputText.trim().length === 0}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        <UserPlus className="w-5 h-5" />
        Add Names
      </button>

      <p className="text-xs text-slate-500">
        Tip: Press Ctrl+Enter to add names quickly
      </p>
    </div>
  )
}

