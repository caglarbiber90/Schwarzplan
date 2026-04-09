import { LayerType } from '../services/overpass'

interface Props {
  layers: Record<LayerType, boolean>
  onToggle: (layer: LayerType) => void
  disabled: boolean
  hasData: boolean
}

const LAYER_INFO: { key: LayerType; label: string; color: string }[] = [
  { key: 'building', label: 'Gebäude', color: '#000000' },
  { key: 'road', label: 'Straßen', color: '#666666' },
  { key: 'water', label: 'Gewässer', color: '#b8d8e8' },
  { key: 'green', label: 'Grünflächen', color: '#c8e6b0' },
  { key: 'forest', label: 'Wald', color: '#a0c890' },
  { key: 'railway', label: 'Eisenbahn', color: '#444444' }
]

export default function LayerToggle({ layers, onToggle, disabled, hasData }: Props) {
  return (
    <div className={`layer-toggle ${!hasData ? 'layer-toggle--empty' : ''}`}>
      {!hasData && (
        <p className="layer-hint">Zuerst eine Adresse suchen, um Ebenen zu aktivieren.</p>
      )}
      <div className="layer-list">
        {LAYER_INFO.map(({ key, label, color }) => (
          <label key={key} className={`layer-item ${!hasData ? 'layer-item--disabled' : ''}`}>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => onToggle(key)}
              disabled={disabled || !hasData}
            />
            <span
              className="layer-swatch"
              style={{ backgroundColor: hasData ? color : '#ccc' }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
