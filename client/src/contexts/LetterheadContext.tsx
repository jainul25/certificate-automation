import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { LetterheadState, LetterheadAction } from '../types/letterhead'

const initialState: LetterheadState = {
  currentStep: 0,
  template: null,
  templateFile: null,
  contentSource: 'editor',
  editorContent: '',
  contentFile: null,
  outputFormat: 'pdf',
  generatedDocument: null,
}

function letterheadReducer(state: LetterheadState, action: LetterheadAction): LetterheadState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    
    case 'SET_TEMPLATE':
      return {
        ...state,
        template: action.payload.template,
        templateFile: action.payload.file,
      }
    
    case 'SET_CONTENT_SOURCE':
      return { ...state, contentSource: action.payload }
    
    case 'SET_EDITOR_CONTENT':
      return { ...state, editorContent: action.payload }
    
    case 'SET_CONTENT_FILE':
      return { ...state, contentFile: action.payload }
    
    case 'SET_OUTPUT_FORMAT':
      return { ...state, outputFormat: action.payload }
    
    case 'SET_GENERATED_DOCUMENT':
      return { ...state, generatedDocument: action.payload }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

interface LetterheadContextType {
  state: LetterheadState
  dispatch: React.Dispatch<LetterheadAction>
}

const LetterheadContext = createContext<LetterheadContextType | undefined>(undefined)

export function LetterheadProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(letterheadReducer, initialState)

  return (
    <LetterheadContext.Provider value={{ state, dispatch }}>
      {children}
    </LetterheadContext.Provider>
  )
}

export function useLetterhead() {
  const context = useContext(LetterheadContext)
  if (!context) {
    throw new Error('useLetterhead must be used within LetterheadProvider')
  }
  return context
}
