import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../services/api'
import { cn } from '../../lib/utils'
import { Move, ZoomIn, ZoomOut, Type, Palette, AlignLeft, AlignCenter, AlignRight, Loader2, Check } from 'lucide-react'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const FONT_OPTIONS = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Helvetica-Bold', label: 'Helvetica Bold' },
  { value: 'Times-Roman', label: 'Times Roman' },
  { value: 'Times-Bold', label: 'Times Bold' },
  { value: 'Courier', label: 'Courier' },
  { value: 'Courier-Bold', label: 'Courier Bold' },
]

export default function PositionMarker() {
  const { state, dispatch } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Local position state for smooth dragging
  const [localPosition, setLocalPosition] = useState({
    x: state.nameFieldPosition?.x || 100,
    y: state.nameFieldPosition?.y || 200,
    width: state.nameFieldPosition?.width || 300,
    height: state.nameFieldPosition?.height || 50,
  })

  const { fontSettings } = state

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    // PDF loaded successfully
  }, [])

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page
    setPdfDimensions({ width, height })
    
    // Initialize position to center if not set
    if (!state.nameFieldPosition) {
      const initialPos = {
        x: (width * scale - 300) / 2,
        y: height * scale * 0.6,
        width: 300,
        height: 50,
      }
      setLocalPosition(initialPos)
      dispatch({
        type: 'SET_NAME_POSITION',
        payload: { ...initialPos, page: 0 },
      })
    }
  }, [state.nameFieldPosition, dispatch, scale])

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()

    if (action === 'drag') {
      setIsDragging(true)
    } else {
      setIsResizing(true)
    }

    setDragStart({
      x: e.clientX - localPosition.x,
      y: e.clientY - localPosition.y,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, pdfDimensions.width * scale - localPosition.width))
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, pdfDimensions.height * scale - localPosition.height))

        setLocalPosition((prev) => ({ ...prev, x: newX, y: newY }))
      } else if (isResizing) {
        const newWidth = Math.max(100, e.clientX - containerRect.left - localPosition.x)
        const newHeight = Math.max(30, e.clientY - containerRect.top - localPosition.y)

        setLocalPosition((prev) => ({
          ...prev,
          width: Math.min(newWidth, pdfDimensions.width * scale - prev.x),
          height: Math.min(newHeight, pdfDimensions.height * scale - prev.y),
        }))
      }
    },
    [isDragging, isResizing, dragStart, localPosition, pdfDimensions, scale]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      // Convert screen coordinates to PDF coordinates
      const pdfPosition = {
        x: localPosition.x / scale,
        y: localPosition.y / scale,
        width: localPosition.width / scale,
        height: localPosition.height / scale,
        page: 0,
      }
      dispatch({ type: 'SET_NAME_POSITION', payload: pdfPosition })
      setSaved(false)
    }
    setIsDragging(false)
    setIsResizing(false)
  }, [isDragging, isResizing, localPosition, scale, dispatch])

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging || isResizing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newPosition = {
      x: Math.max(0, x - localPosition.width / 2),
      y: Math.max(0, y - localPosition.height / 2),
      width: localPosition.width,
      height: localPosition.height,
    }

    setLocalPosition(newPosition)
    dispatch({
      type: 'SET_NAME_POSITION',
      payload: {
        x: newPosition.x / scale,
        y: newPosition.y / scale,
        width: newPosition.width / scale,
        height: newPosition.height / scale,
        page: 0,
      },
    })
    setSaved(false)
  }

  const savePosition = async () => {
    if (!state.template) return

    setIsSaving(true)
    try {
      await api.saveTemplatePosition(
        state.template.id,
        {
          x: localPosition.x / scale,
          y: localPosition.y / scale,
          width: localPosition.width / scale,
          height: localPosition.height / scale,
          page: 0,
        },
        fontSettings
      )
      setSaved(true)
    } catch (error) {
      console.error('Failed to save position:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save position when it changes
  useEffect(() => {
    if (state.nameFieldPosition && state.template) {
      const timer = setTimeout(() => {
        savePosition()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state.nameFieldPosition, fontSettings])

  if (!state.templatePreviewUrl) {
    return (
      <div className="text-center py-12 text-slate-500">
        Please upload a template first
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Mark Name Position</h2>
        <p className="text-slate-600">
          Click on the certificate to position where participant names will appear, then drag to adjust.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Canvas */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm text-slate-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2, s + 0.1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex-1" />

            {saved ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </div>
            ) : isSaving ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : null}
          </div>

          <div
            ref={containerRef}
            className="relative border rounded-xl overflow-auto bg-slate-100 max-h-[500px]"
            style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
            onClick={handleCanvasClick}
          >
            <Document file={state.templatePreviewUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page
                pageNumber={1}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {/* Name Position Marker */}
            <div
              className={cn(
                'absolute border-2 border-blue-500 bg-blue-500/10 rounded',
                'flex items-center justify-center',
                isDragging && 'cursor-grabbing'
              )}
              style={{
                left: localPosition.x,
                top: localPosition.y,
                width: localPosition.width,
                height: localPosition.height,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'drag')}
            >
              {/* Preview text */}
              <span
                className="pointer-events-none select-none truncate px-2"
                style={{
                  fontFamily: fontSettings.family,
                  fontSize: `${fontSettings.size * scale * 0.5}px`,
                  color: fontSettings.color,
                  textAlign: fontSettings.alignment,
                  width: '100%',
                }}
              >
                Sample Name
              </span>

              {/* Move handle */}
              <div
                className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-grab shadow-md"
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
              >
                <Move className="w-3 h-3 text-white" />
              </div>

              {/* Resize handle */}
              <div
                className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 rounded cursor-se-resize shadow-md"
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
              />
            </div>
          </div>
        </div>

        {/* Font Settings Panel */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Font Settings
            </h3>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
              <select
                value={fontSettings.family}
                onChange={(e) => dispatch({ type: 'SET_FONT_SETTINGS', payload: { family: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Font Size: {fontSettings.size}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={fontSettings.size}
                onChange={(e) =>
                  dispatch({ type: 'SET_FONT_SETTINGS', payload: { size: parseInt(e.target.value) } })
                }
                className="w-full"
              />
            </div>

            {/* Font Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Font Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fontSettings.color}
                  onChange={(e) => dispatch({ type: 'SET_FONT_SETTINGS', payload: { color: e.target.value } })}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-300"
                />
                <input
                  type="text"
                  value={fontSettings.color}
                  onChange={(e) => dispatch({ type: 'SET_FONT_SETTINGS', payload: { color: e.target.value } })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alignment</label>
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() =>
                      dispatch({
                        type: 'SET_FONT_SETTINGS',
                        payload: { alignment: value as 'left' | 'center' | 'right' },
                      })
                    }
                    className={cn(
                      'flex-1 p-2 rounded-lg transition-colors',
                      fontSettings.alignment === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="w-5 h-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Preview</h3>
            <div
              className="bg-white border border-slate-200 rounded-lg p-4 min-h-[60px] flex items-center"
              style={{ justifyContent: fontSettings.alignment === 'center' ? 'center' : fontSettings.alignment === 'right' ? 'flex-end' : 'flex-start' }}
            >
              <span
                style={{
                  fontFamily: fontSettings.family,
                  fontSize: `${Math.min(fontSettings.size, 32)}px`,
                  color: fontSettings.color,
                }}
              >
                John Doe
              </span>
            </div>
          </div>

          {state.nameFieldPosition && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-green-800 text-sm">
                Position marked! Click "Continue" to add participant names.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

