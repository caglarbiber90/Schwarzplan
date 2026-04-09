import { useEffect, useRef } from 'react'

interface Props {
  svgContent: string
  pageSize: string
  landscape: boolean
  scale: number
  onConfirm: () => void
  onCancel: () => void
}

export default function ExportPreview({ svgContent, pageSize, landscape, scale, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = svgContent
      const svg = containerRef.current.querySelector('svg')
      if (svg) {
        svg.removeAttribute('width')
        svg.removeAttribute('height')
        svg.style.width = '100%'
        svg.style.height = '100%'
      }
    }
  }, [svgContent])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="preview-overlay" onClick={onCancel}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <span>Vorschau — M 1:{scale} — {pageSize}{landscape ? ' quer' : ''}</span>
          <button className="preview-close" onClick={onCancel}>&times;</button>
        </div>
        <div
          ref={containerRef}
          className={`preview-content ${landscape ? 'preview-landscape' : 'preview-portrait'}`}
        />
        <div className="preview-actions">
          <button className="preview-btn preview-btn--secondary" onClick={onCancel}>Abbrechen</button>
          <button className="preview-btn preview-btn--primary" onClick={onConfirm}>Exportieren</button>
        </div>
      </div>
    </div>
  )
}
