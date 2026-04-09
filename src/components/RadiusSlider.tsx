import { RADIUS_MIN, RADIUS_MAX, RADIUS_WARN } from '../services/constants'

interface Props {
  value: number
  onChange: (value: number) => void
  disabled: boolean
}

export default function RadiusSlider({ value, onChange, disabled }: Props) {
  return (
    <div className="radius-slider">
      <label>
        Radius: <strong>{value}m</strong>
      </label>
      <input
        type="range"
        min={RADIUS_MIN}
        max={RADIUS_MAX}
        step={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
      <div className="range-labels">
        <span>{RADIUS_MIN}m</span>
        <span>{RADIUS_MAX}m</span>
      </div>
      {value >= RADIUS_WARN && (
        <p className="radius-warn">Großer Radius — Abfrage kann länger dauern</p>
      )}
    </div>
  )
}
