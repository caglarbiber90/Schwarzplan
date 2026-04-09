import { SEARCH_DEBOUNCE_MS } from './constants'

// ── Types ──

export interface GeoResult {
  lat: number
  lon: number
  displayName: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  place_id: number
}

// ── API ──

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function searchAddress(query: string): Promise<GeoResult[]> {
  if (query.trim().length < 3) return []

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1'
  })

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'Schwarzplan-TEK-TO-NIK/1.0' }
  })

  if (!res.ok) throw new Error(`Geocoding-Fehler: ${res.status}`)

  const data: unknown = await res.json()

  // Validate response is array
  if (!Array.isArray(data)) return []

  return data
    .filter((item): item is NominatimResult => {
      if (typeof item !== 'object' || item === null) return false
      const r = item as Record<string, unknown>
      const lat = parseFloat(String(r.lat))
      const lon = parseFloat(String(r.lon))
      return !isNaN(lat) && !isNaN(lon) && typeof r.display_name === 'string'
    })
    .map((item) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name
    }))
}
