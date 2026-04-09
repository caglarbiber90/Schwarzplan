import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { OverpassData, OsmWay, OsmNode, LayerType } from '../services/overpass'
import { ROAD_WEIGHTS_MAP, LAYER_STYLES } from '../services/constants'

interface Props {
  center: [number, number]
  zoom: number
  data: OverpassData | null
  visibleLayers: Record<LayerType, boolean>
  exportArea?: { widthM: number; heightM: number } | null
  tileUrl: string
  locked?: boolean
  onMapMove?: (center: [number, number], zoom: number) => void
  onContextClick?: (lat: number, lon: number) => void
}

function wayToLatLngs(way: OsmWay, nodes: Map<number, OsmNode>): L.LatLng[] {
  const out: L.LatLng[] = []
  for (const nid of way.nodes) {
    const n = nodes.get(nid)
    if (n) out.push(L.latLng(n.lat, n.lon))
  }
  return out
}

export default function MapView({ center, zoom, data, visibleLayers, exportArea, tileUrl, locked, onMapMove, onContextClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const featuresRef = useRef<L.LayerGroup | null>(null)
  const rectRef = useRef<L.Rectangle | null>(null)
  const onMoveRef = useRef(onMapMove)
  onMoveRef.current = onMapMove
  const onCtxRef = useRef(onContextClick)
  onCtxRef.current = onContextClick

  const layerKey = JSON.stringify(visibleLayers)

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center, zoom, zoomControl: true, attributionControl: false })

    if (tileUrl) tileRef.current = L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map)

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a> | © <a href="https://carto.com/">CARTO</a>')
      .addTo(map)

    // Scale bar
    L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 150 }).addTo(map)

    map.on('moveend', () => { const c = map.getCenter(); onMoveRef.current?.([c.lat, c.lng], map.getZoom()) })

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      const uid = 'ctx-' + Date.now()
      const popup = L.popup().setLatLng(e.latlng).setContent(
        `<div style="font-size:12px;font-family:sans-serif"><b>${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}</b><br/><a href="#" id="${uid}" style="color:#000;font-weight:600">Schwarzplan hier erstellen</a></div>`
      ).openOn(map)
      setTimeout(() => {
        document.getElementById(uid)?.addEventListener('click', (ev) => {
          ev.preventDefault(); map.closePopup(popup)
          onCtxRef.current?.(e.latlng.lat, e.latlng.lng)
        })
      }, 50)
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line

  // Tile swap
  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (tileRef.current) { map.removeLayer(tileRef.current); tileRef.current = null }
    if (tileUrl) { tileRef.current = L.tileLayer(tileUrl, { maxZoom: 19, subdomains: 'abcd' }).addTo(map); tileRef.current.bringToBack() }
  }, [tileUrl])

  // Fly to
  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (map.getCenter().distanceTo(L.latLng(center[0], center[1])) > 50) {
      map.flyTo(center, zoom, { duration: 1.5 })
    }
  }, [center, zoom])

  // Draw features
  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (featuresRef.current) { map.removeLayer(featuresRef.current); featuresRef.current = null }
    if (!data) return

    const group = L.layerGroup()

    if (visibleLayers.water) for (const w of data.water) { const ll = wayToLatLngs(w, data.nodes); if (ll.length >= 3) L.polygon(ll, LAYER_STYLES.water).addTo(group) }
    if (visibleLayers.green) for (const w of data.green) { const ll = wayToLatLngs(w, data.nodes); if (ll.length >= 3) L.polygon(ll, LAYER_STYLES.green).addTo(group) }
    if (visibleLayers.forest) for (const w of data.forest) { const ll = wayToLatLngs(w, data.nodes); if (ll.length >= 3) L.polygon(ll, LAYER_STYLES.forest).addTo(group) }
    if (visibleLayers.railway) for (const w of data.railway) { const ll = wayToLatLngs(w, data.nodes); if (ll.length >= 2) L.polyline(ll, LAYER_STYLES.railway).addTo(group) }
    if (visibleLayers.road) for (const w of data.roads) { const ll = wayToLatLngs(w, data.nodes); if (ll.length >= 2) L.polyline(ll, { color: '#666', weight: ROAD_WEIGHTS_MAP[w.tags?.highway || ''] || 1.5, opacity: 0.7 }).addTo(group) }
    if (visibleLayers.building) for (const w of data.buildings) { const ll = wayToLatLngs(w, data.nodes); if (ll.length >= 3) L.polygon(ll, LAYER_STYLES.building).addTo(group) }

    group.addTo(map)
    featuresRef.current = group
  }, [data, layerKey]) // eslint-disable-line

  // Lock/unlock map interaction + zoom-to-fit export area
  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (locked) {
      map.dragging.disable(); map.touchZoom.disable(); map.doubleClickZoom.disable()
      map.scrollWheelZoom.disable(); map.boxZoom.disable(); map.keyboard.disable()
      // Zoom to fit the export rectangle
      if (exportArea) {
        const cosLat = Math.cos(center[0] * Math.PI / 180)
        const hLat = (exportArea.heightM / 2) / 111320
        const hLon = (exportArea.widthM / 2) / (111320 * cosLat)
        map.fitBounds([
          [center[0] - hLat, center[1] - hLon],
          [center[0] + hLat, center[1] + hLon]
        ], { padding: [30, 30], animate: true, duration: 0.5 })
      }
    } else {
      map.dragging.enable(); map.touchZoom.enable(); map.doubleClickZoom.enable()
      map.scrollWheelZoom.enable(); map.boxZoom.enable(); map.keyboard.enable()
    }
  }, [locked]) // eslint-disable-line

  // Export rect
  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (rectRef.current) { map.removeLayer(rectRef.current); rectRef.current = null }
    if (!exportArea) return
    const cosLat = Math.cos(center[0] * Math.PI / 180)
    const hLat = (exportArea.heightM / 2) / 111320
    const hLon = (exportArea.widthM / 2) / (111320 * cosLat)
    rectRef.current = L.rectangle(
      [[center[0] - hLat, center[1] - hLon], [center[0] + hLat, center[1] + hLon]],
      { color: '#e00', weight: 2, fill: false, dashArray: '6, 4', interactive: false }
    ).addTo(map)
  }, [center, exportArea])

  return <div ref={containerRef} className="map-container" />
}
