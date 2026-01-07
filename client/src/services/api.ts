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
  ): Promise<{ status: string; progress: number; completedCount: number; totalCount: number }> {
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
}

