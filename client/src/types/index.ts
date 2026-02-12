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
  email?: string
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
  deliveryMethod: 'download' | 'email'
  emailConfig: EmailConfig
  emailSession: EmailSession | null
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
  | { type: 'SET_EMAIL_CONFIG'; payload: EmailConfig }
  | { type: 'SET_EMAIL_SESSION'; payload: EmailSession }
  | { type: 'UPDATE_EMAIL_PROGRESS'; payload: { progress: number; sentCount: number; failedCount: number } }
  | { type: 'SET_DELIVERY_METHOD'; payload: 'download' | 'email' }
  | { type: 'RESET' }

// Email-related types
export interface EmailConfig {
  subject: string
  body: string
  templateId?: string
}export interface EmailParticipant {
  id: string
  name: string
  email: string
  status: 'pending' | 'sent' | 'failed'
  certificatePath?: string
  errorMessage?: string
}export interface EmailSession {
  id: string
  templateId: string
  participants: EmailParticipant[]
  emailConfig: EmailConfig
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  sentCount: number
  failedCount: number
  createdAt: string
  completedAt?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
}
