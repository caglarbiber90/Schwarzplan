import { OverpassData, OsmWay, OsmNode, LayerType } from './overpass'
import { PAPER_SIZES, ROAD_WEIGHTS_SVG } from './constants'
import { isSafeCoord } from './geo'

/**
 * Generate a scale-accurate SVG schwarzplan.
 * viewBox in mm → 1 SVG unit = 1mm when printed at 100%.
 * Uses array-based string building for O(n) performance.
 */
export function generateSVG(
  data: OverpassData,
  centerLat: number,
  centerLon: number,
  scale: number,
  pageSize: string,
  landscape: boolean,
  visibleLayers: Record<LayerType, boolean>
): string {
  const paper = PAPER_SIZES[pageSize] || PAPER_SIZES.A2
  const svgW = landscape ? paper.h : paper.w
  const svgH = landscape ? paper.w : paper.h

  // Real-world extent in meters
  const realW = (svgW * scale) / 1000
  const realH = (svgH * scale) / 1000

  // Bounding box
  const cosLat = Math.cos(centerLat * Math.PI / 180)
  const latRange = realH / 111320
  const lonRange = realW / (111320 * cosLat)
  const minLat = centerLat - latRange / 2
  const minLon = centerLon - lonRange / 2

  // Projection: geo → SVG mm (with XSS-safe validation)
  function project(lat: number, lon: number): { x: number; y: number } | null {
    if (!isSafeCoord(lat) || !isSafeCoord(lon)) return null
    const x = ((lon - minLon) / lonRange) * svgW
    const y = svgH - ((lat - minLat) / latRange) * svgH
    if (!isSafeCoord(x) || !isSafeCoord(y)) return null
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
  }

  function wayToPoints(way: OsmWay, nodes: Map<number, OsmNode>): string {
    const pts: string[] = []
    for (const nid of way.nodes) {
      const n = nodes.get(nid)
      if (!n) continue
      const p = project(n.lat, n.lon)
      if (p) pts.push(`${p.x},${p.y}`)
    }
    return pts.join(' ')
  }

  function wayToPath(way: OsmWay, nodes: Map<number, OsmNode>): string {
    const parts: string[] = []
    for (let i = 0; i < way.nodes.length; i++) {
      const n = nodes.get(way.nodes[i])
      if (!n) continue
      const p = project(n.lat, n.lon)
      if (p) parts.push(`${parts.length === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
    }
    return parts.join(' ')
  }

  // Build SVG with array (O(n) instead of O(n²) string concat)
  const out: string[] = []

  out.push(`<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${svgW} ${svgH}"
     width="${svgW}mm" height="${svgH}mm"
     style="background:#fff">
<title>Schwarzplan – M 1:${scale} – ${pageSize}${landscape ? ' quer' : ''}</title>
<desc>TEK TO NIK Architekten – tektonik.net</desc>`)

  // Water
  if (visibleLayers.water && data.water.length) {
    out.push(`<g id="water" fill="#C8C8C8" stroke="none">`)
    for (const way of data.water) {
      const pts = wayToPoints(way, data.nodes)
      if (pts) out.push(`  <polygon points="${pts}"/>`)
    }
    out.push(`</g>`)
  }

  // Green
  if (visibleLayers.green && data.green.length) {
    out.push(`<g id="green" fill="#D8E8D0" stroke="none">`)
    for (const way of data.green) {
      const pts = wayToPoints(way, data.nodes)
      if (pts) out.push(`  <polygon points="${pts}"/>`)
    }
    out.push(`</g>`)
  }

  // Forest
  if (visibleLayers.forest && data.forest.length) {
    out.push(`<g id="forest" fill="#C0D8B0" stroke="none">`)
    for (const way of data.forest) {
      const pts = wayToPoints(way, data.nodes)
      if (pts) out.push(`  <polygon points="${pts}"/>`)
    }
    out.push(`</g>`)
  }

  // Railway
  if (visibleLayers.railway && data.railway.length) {
    out.push(`<g id="railway" fill="none" stroke="#666" stroke-dasharray="2,1">`)
    for (const way of data.railway) {
      const d = wayToPath(way, data.nodes)
      if (d) out.push(`  <path d="${d}" stroke-width="0.5"/>`)
    }
    out.push(`</g>`)
  }

  // Roads
  if (visibleLayers.road && data.roads.length) {
    out.push(`<g id="roads" fill="none" stroke="#999" stroke-linecap="round" stroke-linejoin="round">`)
    for (const way of data.roads) {
      const d = wayToPath(way, data.nodes)
      const w = ROAD_WEIGHTS_SVG[way.tags?.highway || ''] || 0.3
      if (d) out.push(`  <path d="${d}" stroke-width="${w}"/>`)
    }
    out.push(`</g>`)
  }

  // Buildings (top)
  if (visibleLayers.building && data.buildings.length) {
    out.push(`<g id="buildings" fill="#000" stroke="none">`)
    for (const way of data.buildings) {
      const pts = wayToPoints(way, data.nodes)
      if (pts) out.push(`  <polygon points="${pts}"/>`)
    }
    out.push(`</g>`)
  }

  // Scale bar
  const scaleBarM = scale <= 500 ? 50 : scale <= 1000 ? 100 : 200
  const scaleBarMM = (scaleBarM * 1000) / scale
  const margin = 8
  out.push(`<g id="scalebar" transform="translate(${margin}, ${svgH - margin - 6})">
  <line x1="0" y1="0" x2="${scaleBarMM}" y2="0" stroke="#000" stroke-width="0.4"/>
  <line x1="0" y1="-1.5" x2="0" y2="1.5" stroke="#000" stroke-width="0.3"/>
  <line x1="${scaleBarMM}" y1="-1.5" x2="${scaleBarMM}" y2="1.5" stroke="#000" stroke-width="0.3"/>
  <text x="${scaleBarMM / 2}" y="4" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="2.5">${scaleBarM}m</text>
</g>`)

  // Title block
  out.push(`<g id="titleblock" transform="translate(${svgW - margin}, ${svgH - margin})">
  <text x="0" y="-6" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="2.2" fill="#999">M 1:${scale}</text>
  <text x="0" y="-2.5" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="1.8" fill="#bbb">TEK TO NIK Architekten</text>
</g>`)

  // North arrow
  out.push(`<g id="north" transform="translate(${svgW - margin - 3}, ${margin + 8})">
  <line x1="0" y1="6" x2="0" y2="-6" stroke="#000" stroke-width="0.3"/>
  <polygon points="-1.5,0 0,-6 1.5,0" fill="#000"/>
  <text x="0" y="-8" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="2.5" fill="#000">N</text>
</g>`)

  out.push(`</svg>`)
  return out.join('\n')
}
