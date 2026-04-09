import { OverpassData, OsmWay, OsmNode, LayerType } from './overpass'
import { toMeters, isSafeCoord } from './geo'

/**
 * Generate DXF with building footprints and other layers.
 * Coordinates in real-world meters relative to center point.
 * Each layer type on a separate DXF layer. XSS-safe coordinate validation.
 */
export function generateDXF(
  data: OverpassData,
  centerLat: number,
  centerLon: number,
  visibleLayers: Record<LayerType, boolean>
): string {
  let handle = 100
  const nextHandle = () => (handle++).toString(16).toUpperCase()

  // DXF Header
  let dxf = `0\nSECTION\n2\nHEADER\n`
  dxf += `9\n$ACADVER\n1\nAC1027\n`
  dxf += `9\n$INSUNITS\n70\n6\n`
  dxf += `0\nENDSEC\n`

  // Layer table
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n`
  const layerDefs = [
    { name: 'BUILDINGS', color: 7 },
    { name: 'ROADS', color: 8 },
    { name: 'WATER', color: 5 },
    { name: 'GREEN', color: 3 },
    { name: 'FOREST', color: 94 },
    { name: 'RAILWAY', color: 8 }
  ]
  for (const ld of layerDefs) {
    dxf += `0\nLAYER\n5\n${nextHandle()}\n100\nAcDbSymbolTableRecord\n100\nAcDbLayerTableRecord\n`
    dxf += `2\n${ld.name}\n70\n0\n62\n${ld.color}\n6\nContinuous\n`
  }
  dxf += `0\nENDTAB\n0\nENDSEC\n`

  // Entities
  dxf += `0\nSECTION\n2\nENTITIES\n`

  function getPoints(way: OsmWay, nodes: Map<number, OsmNode>): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = []
    for (const nid of way.nodes) {
      const n = nodes.get(nid)
      if (!n || !isSafeCoord(n.lat) || !isSafeCoord(n.lon)) continue
      const m = toMeters(n.lat, n.lon, centerLat, centerLon)
      if (isSafeCoord(m.x) && isSafeCoord(m.y)) pts.push(m)
    }
    return pts
  }

  function addPolyline(way: OsmWay, nodes: Map<number, OsmNode>, layerName: string, closed: boolean) {
    const pts = getPoints(way, nodes)
    if ((closed && pts.length < 3) || (!closed && pts.length < 2)) return
    dxf += `0\nLWPOLYLINE\n5\n${nextHandle()}\n100\nAcDbEntity\n8\n${layerName}\n100\nAcDbPolyline\n`
    dxf += `90\n${pts.length}\n70\n${closed ? 1 : 0}\n`
    for (const p of pts) dxf += `10\n${p.x}\n20\n${p.y}\n`
  }

  if (visibleLayers.water) for (const w of data.water) addPolyline(w, data.nodes, 'WATER', true)
  if (visibleLayers.green) for (const w of data.green) addPolyline(w, data.nodes, 'GREEN', true)
  if (visibleLayers.forest) for (const w of data.forest) addPolyline(w, data.nodes, 'FOREST', true)
  if (visibleLayers.railway) for (const w of data.railway) addPolyline(w, data.nodes, 'RAILWAY', false)
  if (visibleLayers.road) for (const w of data.roads) addPolyline(w, data.nodes, 'ROADS', false)
  if (visibleLayers.building) for (const w of data.buildings) addPolyline(w, data.nodes, 'BUILDINGS', true)

  dxf += `0\nENDSEC\n0\nEOF\n`
  return dxf
}
