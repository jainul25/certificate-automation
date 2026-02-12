const API_BASE = '/api'

export interface ApiError {
  message: string
  code?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export const api = {
  // Template endpoints
  async uploadTemplate(file: File): Promise<{ templateId: string; previewUrl: string }> {
    const formData = new FormData()
    formData.append('template', file)

    const response = await fetch(`${API_BASE}/templates/upload`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async saveTemplatePosition(
    templateId: string,
    position: { x: number; y: number; width: number; height: number; page: number },
    fontSettings: { family: string; size: number; color: string; alignment: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/templates/${templateId}/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, fontSettings }),
    })
    return handleResponse(response)
  },

  async getTemplate(templateId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/templates/${templateId}`)
    return handleResponse(response)
  },

  // Participant endpoints
  async parseManualNames(names: string[]): Promise<{ participants: any[]; count: number }> {
    const response = await fetch(`${API_BASE}/participants/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
    })
    return handleResponse(response)
  },

  async parseExcelFile(file: File): Promise<{ participants: any[]; count: number; errors: string[] }> {
    const formData = new FormData()
    formData.append('excel', file)

    const response = await fetch(`${API_BASE}/participants/excel`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  // Certificate generation endpoints
  async generateCertificates(
    templateId: string,
    participants: { id: string; name: string }[]
  ): Promise<{ sessionId: string; status: string }> {
    const response = await fetch(`${API_BASE}/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, participants }),
    })
    return handleResponse(response)
  },

  async getSessionStatus(
    sessionId: string
  ): Promise<{ status: string; progress: number; completedCount: number; totalCount: number; errorCount: number }> {
    const response = await fetch(`${API_BASE}/certificates/session/${sessionId}/status`)
    return handleResponse(response)
  },

  getDownloadUrl(sessionId: string): string {
    return `${API_BASE}/certificates/session/${sessionId}/download`
  },

  async getPreviewCertificate(
    templateId: string,
    name: string
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE}/certificates/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, name }),
    })
    if (!response.ok) {
      throw new Error('Failed to generate preview')
    }
    return response.blob()
  },

  // Letterhead endpoints
  async uploadLetterheadTemplate(file: File): Promise<{ templateId: string; filename: string; originalName: string; fileType: string; previewUrl: string }> {
    const formData = new FormData()
    formData.append('template', file)

    const response = await fetch(`${API_BASE}/letterhead/upload-template`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async uploadLetterheadContent(file: File): Promise<{ contentId: string; filename: string; originalName: string; filePath: string }> {
    const formData = new FormData()
    formData.append('content', file)

    const response = await fetch(`${API_BASE}/letterhead/upload-content`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  async generateLetterhead(
    templateId: string,
    contentSource: 'editor' | 'upload',
    contentHtml?: string,
    contentFilePath?: string,
    outputFormat?: 'pdf' | 'docx'
  ): Promise<{ sessionId: string; status: string }> {
    const response = await fetch(`${API_BASE}/letterhead/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId,
        contentSource,
        contentHtml,
        contentFilePath,
        outputFormat: outputFormat || 'pdf',
      }),
    })
    return handleResponse(response)
  },

  async getLetterheadDocument(documentId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/letterhead/${documentId}`)
    return handleResponse(response)
  },

  getLetterheadDownloadUrl(documentId: string): string {
    return `${API_BASE}/letterhead/${documentId}/download`
  },

  // Email endpoints
  async sendBulkEmails(
    templateId: string,
    participants: { id: string; name: string; email: string }[],
    emailConfig: { subject: string; body: string }
  ): Promise<{ sessionId: string; status: string; totalCount: number; validCount: number }> {
    const response = await fetch(`${API_BASE}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, participants, emailConfig }),
    })
    return handleResponse(response)
  },

  async getEmailSessionStatus(
    sessionId: string
  ): Promise<{
    status: string
    progress: number
    sentCount: number
    failedCount: number
    totalCount: number
    participants: any[]
  }> {
    const response = await fetch(`${API_BASE}/email/session/${sessionId}/status`)
    return handleResponse(response)
  },

  async sendTestEmail(
    email: string,
    emailConfig: { subject: string; body: string }
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/email/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, emailConfig }),
    })
    return handleResponse(response)
  },

  async saveEmailTemplate(
    name: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; template: any }> {
    const response = await fetch(`${API_BASE}/email/templates/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, body }),
    })
    return handleResponse(response)
  },

  async getEmailTemplates(): Promise<{ templates: any[] }> {
    const response = await fetch(`${API_BASE}/email/templates`)
    return handleResponse(response)
  },

  async checkEmailConfig(): Promise<{ configured: boolean; connected: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/email/config/check`)
    return handleResponse(response)
  },
}

