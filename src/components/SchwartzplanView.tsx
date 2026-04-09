import { useMemo } from 'react'
import { OverpassData, OsmWay, OsmNode } from '../services/overpass'
import { BBox, createProjection } from '../services/projection'

interface Props {
  data: OverpassData
  bbox: BBox
  width: number
  height: number
}

const ROAD_WIDTHS: Record<string, number> = {
  motorway: 3,
  trunk: 2.5,
  primary: 2,
  secondary: 1.8,
  tertiary: 1.5,
  residential: 1,
  living_street: 0.8,
  pedestrian: 0.6,
  service: 0.5,
  unclassified: 1,
  footway: 0.3
}

function wayToPoints(way: OsmWay, nodes: Map<number, OsmNode>, project: (lat: number, lon: number) => { x: number; y: number }): string {
  const points: string[] = []
  for (const nodeId of way.nodes) {
    const node = nodes.get(nodeId)
    if (node) {
      const p = project(node.lat, node.lon)
      points.push(`${p.x},${p.y}`)
    }
  }
  return points.join(' ')
}

function wayToPath(way: OsmWay, nodes: Map<number, OsmNode>, project: (lat: number, lon: number) => { x: number; y: number }): string {
  const parts: string[] = []
  for (let i = 0; i < way.nodes.length; i++) {
    const node = nodes.get(way.nodes[i])
    if (node) {
      const p = project(node.lat, node.lon)
      parts.push(`${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
    }
  }
  return parts.join(' ')
}

export default function SchwartzplanView({ data, bbox, width, height }: Props) {
  const projection = useMemo(() => createProjection(bbox, width, height), [bbox, width, height])

  const waterPolygons = useMemo(() =>
    data.water.map((way) => ({
      id: way.id,
      points: wayToPoints(way, data.nodes, projection.project)
    })).filter(w => w.points.length > 0),
    [data.water, data.nodes, projection]
  )

  const roadPaths = useMemo(() =>
    data.roads.map((way) => ({
      id: way.id,
      d: wayToPath(way, data.nodes, projection.project),
      width: ROAD_WIDTHS[way.tags?.highway || ''] || 1
    })).filter(r => r.d.length > 0),
    [data.roads, data.nodes, projection]
  )

  const buildingPolygons = useMemo(() =>
    data.buildings.map((way) => ({
      id: way.id,
      points: wayToPoints(way, data.nodes, projection.project)
    })).filter(b => b.points.length > 0),
    [data.buildings, data.nodes, projection]
  )

  return (
    <div className="schwarzplan-container" id="schwarzplan-print">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Water layer */}
        {waterPolygons.map((w) => (
          <polygon
            key={`water-${w.id}`}
            points={w.points}
            fill="#C8C8C8"
            stroke="none"
          />
        ))}

        {/* Road layer */}
        {roadPaths.map((r) => (
          <path
            key={`road-${r.id}`}
            d={r.d}
            stroke="#999999"
            strokeWidth={r.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Building layer (topmost) */}
        {buildingPolygons.map((b) => (
          <polygon
            key={`bldg-${b.id}`}
            points={b.points}
            fill="#000000"
            stroke="none"
          />
        ))}
      </svg>
    </div>
  )
}
