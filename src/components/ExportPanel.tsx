import { getQueryRadius } from '../services/scaleHelper'

interface Props {
  disabled: boolean
  exporting: boolean
  onScaleChange: (scale: number, radius: number) => void
  currentScale: number
  pageSize: string
  onPageSizeChange: (size: string) => void
  landscape: boolean
  onLandscapeChange: (v: boolean) => void
  onExportSVG: () => void
  onExportPDF: () => void
  onExportDXF: () => void
}

const SCALES = [
  { value: 200, label: '1:200' },
  { value: 500, label: '1:500' },
  { value: 1000, label: '1:1.000' },
  { value: 2000, label: '1:2.000' }
]

const PAGE_SIZES = [
  { value: 'A4', label: 'A4 (210\u00d7297mm)' },
  { value: 'A3', label: 'A3 (297\u00d7420mm)' },
  { value: 'A2', label: 'A2 (420\u00d7594mm)' },
  { value: 'A1', label: 'A1 (594\u00d7841mm)' },
  { value: 'A0', label: 'A0 (841\u00d71189mm)' }
]

export default function ExportPanel({
  disabled, exporting, onScaleChange, currentScale,
  pageSize, onPageSizeChange, landscape, onLandscapeChange,
  onExportSVG, onExportPDF, onExportDXF
}: Props) {

  function handleScaleChange(scale: number) {
    onScaleChange(scale, getQueryRadius(scale, pageSize, landscape))
  }

  function handlePageSizeChange(size: string) {
    onPageSizeChange(size)
    onScaleChange(currentScale, getQueryRadius(currentScale, size, landscape))
  }

  function handleLandscapeChange(v: boolean) {
    onLandscapeChange(v)
    onScaleChange(currentScale, getQueryRadius(currentScale, pageSize, v))
  }

  const btnDisabled = disabled || exporting

  return (
    <div className="export-panel">
      <div className="export-row">
        <label>Maßstab</label>
        <div className="scale-buttons">
          {SCALES.map((s) => (
            <button
              key={s.value}
              className={`scale-btn ${currentScale === s.value ? 'active' : ''}`}
              onClick={() => handleScaleChange(s.value)}
              disabled={disabled}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="export-row">
        <label>Papierformat</label>
        <select value={pageSize} onChange={(e) => handlePageSizeChange(e.target.value)}>
          {PAGE_SIZES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="export-row">
        <label className="checkbox-label">
          <input type="checkbox" checked={landscape} onChange={(e) => handleLandscapeChange(e.target.checked)} />
          Querformat
        </label>
      </div>

      <div className="export-buttons">
        <button className="export-btn-format" onClick={onExportSVG} disabled={btnDisabled}>
          {exporting ? '...' : 'SVG'}
        </button>
        <button className="export-btn-format" onClick={onExportPDF} disabled={btnDisabled}>
          {exporting ? '...' : 'PDF'}
        </button>
        <button className="export-btn-format" onClick={onExportDXF} disabled={btnDisabled}>
          {exporting ? '...' : 'DXF'}
        </button>
      </div>
    </div>
  )
}
