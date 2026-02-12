export interface LetterheadTemplate {
  id: string
  filename: string
  originalName: string
  fileType: 'pdf' | 'docx'
  previewUrl: string
}

export interface LetterheadDocument {
  id: string
  templateId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generatedDocPath?: string
  previewUrl?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export interface LetterheadState {
  currentStep: number
  template: LetterheadTemplate | null
  templateFile: File | null
  contentSource: 'editor' | 'upload'
  editorContent: string
  contentFile: File | null
  outputFormat: 'pdf' | 'docx'
  generatedDocument: LetterheadDocument | null
}

export type LetterheadAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_TEMPLATE'; payload: { template: LetterheadTemplate; file: File } }
  | { type: 'SET_CONTENT_SOURCE'; payload: 'editor' | 'upload' }
  | { type: 'SET_EDITOR_CONTENT'; payload: string }
  | { type: 'SET_CONTENT_FILE'; payload: File | null }
  | { type: 'SET_OUTPUT_FORMAT'; payload: 'pdf' | 'docx' }
  | { type: 'SET_GENERATED_DOCUMENT'; payload: LetterheadDocument }
  | { type: 'RESET' }
