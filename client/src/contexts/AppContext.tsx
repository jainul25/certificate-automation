import { createContext, useContext, useReducer, ReactNode } from 'react'
import type { AppState, AppAction, FontSettings } from '../types'

const defaultFontSettings: FontSettings = {
  family: 'Helvetica',
  size: 36,
  color: '#000000',
  alignment: 'center',
}

const initialState: AppState = {
  currentStep: 0,
  template: null,
  templateFile: null,
  templatePreviewUrl: null,
  nameFieldPosition: null,
  fontSettings: defaultFontSettings,
  participants: [],
  generationSession: null,
  deliveryMethod: 'download',
  emailConfig: {
    subject: 'Your Certificate is Ready',
    body: 'Dear {name},\n\nPlease find attached your certificate.\n\nBest regards',
  },
  emailSession: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'SET_TEMPLATE':
      return { ...state, template: action.payload }
    case 'SET_TEMPLATE_FILE':
      return {
        ...state,
        templateFile: action.payload.file,
        templatePreviewUrl: action.payload.previewUrl,
      }
    case 'SET_NAME_POSITION':
      return { ...state, nameFieldPosition: action.payload }
    case 'SET_FONT_SETTINGS':
      return {
        ...state,
        fontSettings: { ...state.fontSettings, ...action.payload },
      }
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload }
    case 'ADD_PARTICIPANTS':
      return {
        ...state,
        participants: [...state.participants, ...action.payload],
      }
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== action.payload),
      }
    case 'SET_GENERATION_SESSION':
      return { ...state, generationSession: action.payload }
    case 'UPDATE_SESSION_PROGRESS':
      return state.generationSession
        ? {
            ...state,
            generationSession: {
              ...state.generationSession,
              progress: action.payload.progress,
              status: action.payload.status,
            },
          }
        : state
    case 'SET_EMAIL_CONFIG':
      return { ...state, emailConfig: action.payload }
    case 'SET_EMAIL_SESSION':
      return { ...state, emailSession: action.payload }
    case 'UPDATE_EMAIL_PROGRESS':
      return state.emailSession
        ? {
            ...state,
            emailSession: {
              ...state.emailSession,
              progress: action.payload.progress,
              sentCount: action.payload.sentCount,
              failedCount: action.payload.failedCount,
            },
          }
        : state
    case 'SET_DELIVERY_METHOD':
      return { ...state, deliveryMethod: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

