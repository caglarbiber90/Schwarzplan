// ── Paper Sizes (mm) ──
export const PAPER_SIZES: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
  A1: { w: 594, h: 841 },
  A0: { w: 841, h: 1189 }
}

// ── Overpass ──
export const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
]
export const OVERPASS_QUERY_TIMEOUT = 90         // seconds (server-side)
export const OVERPASS_CLIENT_TIMEOUT = 120_000   // ms (client-side AbortController)
export const OVERPASS_CACHE_TTL = 5 * 60 * 1000  // 5 minutes

// ── Debounce ──
export const SEARCH_DEBOUNCE_MS = 400
export const LOAD_DEBOUNCE_MS = 500

// ── Road widths on map (Leaflet pixels) ──
export const ROAD_WEIGHTS_MAP: Record<string, number> = {
  motorway: 4, trunk: 3.5, primary: 3, secondary: 2.5,
  tertiary: 2, residential: 1.5, living_street: 1.2,
  pedestrian: 1, service: 0.8, unclassified: 1.5,
  footway: 0.5, cycleway: 0.6
}

// ── Road widths for SVG export (mm at scale) ──
export const ROAD_WEIGHTS_SVG: Record<string, number> = {
  motorway: 1.2, trunk: 1.0, primary: 0.8, secondary: 0.6,
  tertiary: 0.5, residential: 0.35, living_street: 0.3,
  pedestrian: 0.2, service: 0.15, unclassified: 0.35,
  footway: 0.1, cycleway: 0.12
}

// ── Layer styles for Leaflet ──
export const LAYER_STYLES: Record<string, any> = {
  building: { color: '#000', fillColor: '#000', fillOpacity: 0.9, weight: 0.5 },
  water:    { color: '#99c0d8', fillColor: '#b8d8e8', fillOpacity: 0.7, weight: 0.5 },
  green:    { color: '#8cb878', fillColor: '#c8e6b0', fillOpacity: 0.5, weight: 0.5 },
  forest:   { color: '#6b9b5a', fillColor: '#a0c890', fillOpacity: 0.6, weight: 0.5 },
  railway:  { color: '#444', weight: 2, opacity: 0.6, dashArray: '8, 4', fill: false }
}

// ── Radius limits ──
export const RADIUS_MIN = 100
export const RADIUS_MAX = 2000
export const RADIUS_WARN = 1500
