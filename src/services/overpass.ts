import { OVERPASS_SERVERS, OVERPASS_QUERY_TIMEOUT, OVERPASS_CACHE_TTL } from './constants'
import { isSafeCoord } from './geo'

// ── Types ──

export interface OsmNode {
  id: number
  lat: number
  lon: number
}

export interface OsmWay {
  id: number
  nodes: number[]
  tags?: Record<string, string>
}

export interface OverpassData {
  buildings: OsmWay[]
  roads: OsmWay[]
  water: OsmWay[]
  green: OsmWay[]
  forest: OsmWay[]
  railway: OsmWay[]
  nodes: Map<number, OsmNode>
}

export type LayerType = 'building' | 'road' | 'water' | 'green' | 'forest' | 'railway'

// ── Overpass Response Types (no more `any`) ──

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  nodes?: number[]
  tags?: Record<string, string>
  members?: { type: string; ref: number; role: string }[]
}

// ── Cache ──

interface CacheEntry {
  data: OverpassData
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function cacheKey(lat: number, lon: number, radius: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)},${radius}`
}

function getCached(lat: number, lon: number, radius: number): OverpassData | null {
  const key = cacheKey(lat, lon, radius)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > OVERPASS_CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(lat: number, lon: number, radius: number, data: OverpassData): void {
  const key = cacheKey(lat, lon, radius)
  cache.set(key, { data, timestamp: Date.now() })
  // Evict old entries (keep max 20)
  if (cache.size > 20) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
}

// ── Network ──

function isJsonResponse(res: Response): boolean {
  return (res.headers.get('content-type') || '').includes('json')
}

async function fetchOverpass(body: string, signal?: AbortSignal): Promise<Response> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal
  }

  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, init)
      if (res.ok && isJsonResponse(res)) return res
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      continue
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      continue
    }
  }

  // Retry main server after 5s
  await new Promise(r => setTimeout(r, 5000))
  const res = await fetch(OVERPASS_SERVERS[0], init)
  if (res.ok && isJsonResponse(res)) return res

  throw new Error(
    res.status === 429
      ? 'Alle Overpass-Server sind überlastet. Bitte 30 Sekunden warten und erneut versuchen.'
      : `Overpass-Fehler: ${res.status}`
  )
}

// ── Public API ──

export async function fetchMapData(
  lat: number, lon: number, radius: number, signal?: AbortSignal
): Promise<OverpassData> {
  // Check cache first
  const cached = getCached(lat, lon, radius)
  if (cached) return cached

  const query = `
[out:json][timeout:${OVERPASS_QUERY_TIMEOUT}];
(
  way["building"](around:${radius},${lat},${lon});
  relation["building"](around:${radius},${lat},${lon});
  way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|pedestrian|service|unclassified|living_street|footway|cycleway"](around:${radius},${lat},${lon});
  way["waterway"](around:${radius},${lat},${lon});
  way["natural"="water"](around:${radius},${lat},${lon});
  relation["natural"="water"](around:${radius},${lat},${lon});
  way["leisure"="swimming_pool"](around:${radius},${lat},${lon});
  way["landuse"="reservoir"](around:${radius},${lat},${lon});
  way["landuse"~"grass|meadow|recreation_ground|village_green"](around:${radius},${lat},${lon});
  way["leisure"~"park|garden|playground"](around:${radius},${lat},${lon});
  relation["leisure"="park"](around:${radius},${lat},${lon});
  way["landuse"="forest"](around:${radius},${lat},${lon});
  way["natural"="wood"](around:${radius},${lat},${lon});
  relation["landuse"="forest"](around:${radius},${lat},${lon});
  relation["natural"="wood"](around:${radius},${lat},${lon});
  way["railway"~"rail|light_rail|subway|tram"](around:${radius},${lat},${lon});
);
out body;
>;
out skel qt;
`.trim()

  const res = await fetchOverpass(`data=${encodeURIComponent(query)}`, signal)

  const text = await res.text()
  if (text.startsWith('<?xml') || text.startsWith('<html')) {
    throw new Error('Overpass-Server hat ungültige Antwort geliefert. Bitte erneut versuchen.')
  }

  let json: { elements?: OverpassElement[] }
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Overpass-Antwort konnte nicht gelesen werden. Bitte erneut versuchen.')
  }

  if (!Array.isArray(json.elements)) {
    throw new Error('Keine Kartendaten in der Antwort gefunden.')
  }

  const data = parseOverpassResponse(json.elements)
  setCache(lat, lon, radius, data)
  return data
}

// ── Parser ──

function parseOverpassResponse(elements: OverpassElement[]): OverpassData {
  const nodes = new Map<number, OsmNode>()
  const buildings: OsmWay[] = []
  const roads: OsmWay[] = []
  const water: OsmWay[] = []
  const green: OsmWay[] = []
  const forest: OsmWay[] = []
  const railway: OsmWay[] = []

  // Pass 1: collect validated nodes
  for (const el of elements) {
    if (el.type === 'node' && isSafeCoord(el.lat!) && isSafeCoord(el.lon!)) {
      nodes.set(el.id, { id: el.id, lat: el.lat!, lon: el.lon! })
    }
  }

  // Pass 2: categorize ways
  for (const el of elements) {
    if (el.type === 'way' && el.tags && Array.isArray(el.nodes)) {
      const way: OsmWay = { id: el.id, nodes: el.nodes, tags: el.tags }
      categorizeWay(way, el.tags, buildings, roads, water, green, forest, railway)
    }

    // Relations — with null safety
    if (el.type === 'relation' && el.tags && Array.isArray(el.members)) {
      for (const member of el.members) {
        if (member.type !== 'way') continue
        const memberEl = elements.find(e => e.type === 'way' && e.id === member.ref)
        if (!memberEl || !Array.isArray(memberEl.nodes)) continue
        const way: OsmWay = { id: memberEl.id, nodes: memberEl.nodes, tags: el.tags }
        categorizeWay(way, el.tags, buildings, roads, water, green, forest, railway)
      }
    }
  }

  return { buildings, roads, water, green, forest, railway, nodes }
}

function categorizeWay(
  way: OsmWay, tags: Record<string, string>,
  buildings: OsmWay[], roads: OsmWay[], water: OsmWay[],
  green: OsmWay[], forest: OsmWay[], railway: OsmWay[]
): void {
  if (tags.building) buildings.push(way)
  else if (tags.railway) railway.push(way)
  else if (tags.highway) roads.push(way)
  else if (tags.natural === 'water' || tags.waterway || tags.leisure === 'swimming_pool' || tags.landuse === 'reservoir') water.push(way)
  else if (tags.landuse === 'forest' || tags.natural === 'wood') forest.push(way)
  else if (['grass', 'meadow', 'recreation_ground', 'village_green'].includes(tags.landuse || '') ||
           ['park', 'garden', 'playground'].includes(tags.leisure || '')) green.push(way)
}
