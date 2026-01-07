export interface NameFieldPosition {
  x: number
  y: number
  width: number
  height: number
  page: number
}

export interface FontSettings {
  family: string
  size: number
  color: string
  alignment: 'left' | 'center' | 'right'
}

export interface Template {
  id: string
  name: string
  filename: string
  filePath: string
  thumbnailPath?: string
  nameFieldPosition: NameFieldPosition
  fontSettings: FontSettings
  createdAt: string
  updatedAt: string
}

export interface Participant {
  id: string
  name: string
  status: 'pending' | 'processed' | 'error'
  certificatePath?: string
  errorMessage?: string
}

export interface GenerationSession {
  id: string
  templateId: string
  participants: Participant[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  outputZipPath?: string
  createdAt: string
  completedAt?: string
}

export interface AppState {
  currentStep: number
  template: Template | null
  templateFile: File | null
  templatePreviewUrl: string | null
  nameFieldPosition: NameFieldPosition | null
  fontSettings: FontSettings
  participants: Participant[]
  generationSession: GenerationSession | null
}

export type AppAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_TEMPLATE'; payload: Template }
  | { type: 'SET_TEMPLATE_FILE'; payload: { file: File; previewUrl: string } }
  | { type: 'SET_NAME_POSITION'; payload: NameFieldPosition }
  | { type: 'SET_FONT_SETTINGS'; payload: Partial<FontSettings> }
  | { type: 'SET_PARTICIPANTS'; payload: Participant[] }
  | { type: 'ADD_PARTICIPANTS'; payload: Participant[] }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'SET_GENERATION_SESSION'; payload: GenerationSession }
  | { type: 'UPDATE_SESSION_PROGRESS'; payload: { progress: number; status: GenerationSession['status'] } }
  | { type: 'RESET' }

