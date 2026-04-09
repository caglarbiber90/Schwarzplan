/** Shared geographic utility functions. Single source of truth for projection math. */

const DEG_TO_M = 111320 // meters per degree latitude (approximate)

/** Convert lat/lon to meters relative to a center point. */
export function toMeters(
  lat: number, lon: number,
  centerLat: number, centerLon: number
): { x: number; y: number } {
  const cosLat = Math.cos(centerLat * Math.PI / 180)
  return {
    x: round3((lon - centerLon) * DEG_TO_M * cosLat),
    y: round3((lat - centerLat) * DEG_TO_M)
  }
}

/** Compute bounding box in degrees for a center + radius in meters. */
export function computeBBox(centerLat: number, centerLon: number, radiusM: number) {
  const latDeg = radiusM / DEG_TO_M
  const lonDeg = radiusM / (DEG_TO_M * Math.cos(centerLat * Math.PI / 180))
  return {
    minLat: centerLat - latDeg,
    maxLat: centerLat + latDeg,
    minLon: centerLon - lonDeg,
    maxLon: centerLon + lonDeg
  }
}

/** Validate that a number is finite and safe for SVG/DXF output. */
export function isSafeCoord(n: number): boolean {
  return typeof n === 'number' && isFinite(n) && !isNaN(n)
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}
