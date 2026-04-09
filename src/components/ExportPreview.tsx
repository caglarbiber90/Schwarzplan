import { useEffect, useRef } from 'react'
import { PAPER_SIZES } from '../services/constants'

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

  // Paper aspect ratio
  const paper = PAPER_SIZES[pageSize] || PAPER_SIZES.A2
  const w = landscape ? paper.h : paper.w
  const h = landscape ? paper.w : paper.h
  const aspect = w / h // >1 = landscape, <1 = portrait

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="preview-overlay" onClick={onCancel}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <span>Vorschau — M 1:{scale} — {pageSize}{landscape ? ' quer' : ''} ({w}×{h}mm)</span>
          <button className="preview-close" onClick={onCancel}>&times;</button>
        </div>
        <div className="preview-content">
          <div
            ref={containerRef}
            className="preview-paper"
            style={{ aspectRatio: `${w} / ${h}`, maxWidth: aspect >= 1 ? '100%' : undefined, maxHeight: aspect < 1 ? '100%' : undefined }}
          />
        </div>
        <div className="preview-actions">
          <button className="preview-btn preview-btn--secondary" onClick={onCancel}>Abbrechen</button>
          <button className="preview-btn preview-btn--primary" onClick={onConfirm}>Exportieren</button>
        </div>
      </div>
    </div>
  )
}
