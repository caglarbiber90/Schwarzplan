// All styles use the keyless OpenStreetMap tile server. CARTO basemaps now
// require an API key, so "Hell" and "Dunkel" are CSS-filtered OSM tiles.
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export interface MapStyle {
  id: string
  label: string
  url: string
  className: string
}

const MAP_STYLES: MapStyle[] = [
  { id: 'light', label: 'Hell', url: OSM_TILES, className: 'tiles-light' },
  { id: 'dark', label: 'Dunkel', url: OSM_TILES, className: 'tiles-dark' },
  { id: 'osm', label: 'OSM', url: OSM_TILES, className: '' },
  { id: 'none', label: 'Ohne', url: '', className: '' }
]

interface Props {
  value: string
  onChange: (style: MapStyle) => void
}

export default function MapStyleSelector({ value, onChange }: Props) {
  return (
    <div className="map-style-selector">
      <div className="style-buttons">
        {MAP_STYLES.map((s) => (
          <button
            key={s.id}
            className={`style-btn ${value === s.id ? 'active' : ''}`}
            onClick={() => onChange(s)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { MAP_STYLES }
