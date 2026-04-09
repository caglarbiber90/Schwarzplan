const MAP_STYLES = [
  { id: 'light', label: 'Hell', url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png' },
  { id: 'dark', label: 'Dunkel', url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' },
  { id: 'osm', label: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { id: 'none', label: 'Ohne', url: '' }
]

interface Props {
  value: string
  onChange: (styleId: string, url: string) => void
}

export default function MapStyleSelector({ value, onChange }: Props) {
  return (
    <div className="map-style-selector">
      <label className="section-label">Kartenstil</label>
      <div className="style-buttons">
        {MAP_STYLES.map((s) => (
          <button
            key={s.id}
            className={`style-btn ${value === s.id ? 'active' : ''}`}
            onClick={() => onChange(s.id, s.url)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { MAP_STYLES }
