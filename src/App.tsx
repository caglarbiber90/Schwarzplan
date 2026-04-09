import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import AddressSearch from './components/AddressSearch'
import RadiusSlider from './components/RadiusSlider'
import ExportPanel from './components/ExportPanel'
import MapView from './components/MapView'
import LayerToggle from './components/LayerToggle'
import TektonikLogo from './components/TektonikLogo'
import MapStyleSelector from './components/MapStyleSelector'
import Section from './components/Section'
import ExportPreview from './components/ExportPreview'
import { IconSearch, IconRadius, IconLayers, IconExport, IconMap, IconEye } from './components/Icons'
import { GeoResult } from './services/geocoding'
import { fetchMapData, OverpassData, LayerType } from './services/overpass'
import { getQueryRadius, getRealDimensions } from './services/scaleHelper'
import { generateSVG } from './services/svgExport'
import { generateDXF } from './services/dxfExport'
import { LOAD_DEBOUNCE_MS, OVERPASS_CLIENT_TIMEOUT } from './services/constants'

const DEFAULT_CENTER: [number, number] = [50.1109, 8.6821]
const DEFAULT_ZOOM = 15

export default function App() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [location, setLocation] = useState<GeoResult | null>(null)
  const [radius, setRadius] = useState(364)
  const [scale, setScale] = useState(1000)
  const [pageSize, setPageSize] = useState('A2')
  const [landscape, setLandscape] = useState(false)
  const [mapData, setMapData] = useState<OverpassData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [tileStyle, setTileStyle] = useState('light')
  const [tileUrl, setTileUrl] = useState('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png')
  const [exporting, setExporting] = useState(false)
  const [preview, setPreview] = useState<{ svg: string; format: 'svg' | 'pdf' | 'dxf' } | null>(null)
  const [layers, setLayers] = useState<Record<LayerType, boolean>>({
    building: true, road: true, water: true,
    green: false, forest: false, railway: false
  })

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastLoadRef = useRef<{ lat: number; lon: number; radius: number } | null>(null)

  // ── Online/offline ──
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => { setOnline(false); showToast('Keine Internetverbindung') }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (preview) return // don't intercept when preview open
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); startExport('svg') }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); startExport('pdf') }
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); startExport('dxf') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const stats = useMemo(() => {
    if (!mapData) return null
    return {
      buildings: mapData.buildings.length, roads: mapData.roads.length,
      water: mapData.water.length, green: mapData.green.length,
      forest: mapData.forest.length, railway: mapData.railway.length
    }
  }, [mapData])

  // ── Data loading ──
  const loadData = useCallback(async (lat: number, lon: number, rad: number) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), OVERPASS_CLIENT_TIMEOUT)

    setLoading(true)
    setError(null)
    lastLoadRef.current = { lat, lon, radius: rad }

    try {
      const data = await fetchMapData(lat, lon, rad, controller.signal)
      setMapData(data)
      if (data.buildings.length === 0) showToast('Keine Gebäude in diesem Bereich gefunden.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kartendaten')
      setMapData(null)
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [])

  function loadDebounced(lat: number, lon: number, rad: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadData(lat, lon, rad), LOAD_DEBOUNCE_MS)
  }

  // ── Handlers ──
  function handleAddressSelect(result: GeoResult) {
    setLocation(result)
    setCenter([result.lat, result.lon])
    setZoom(16)
    const rad = getQueryRadius(scale, pageSize, landscape)
    setRadius(rad)
    loadData(result.lat, result.lon, rad)
  }

  function handleScaleChange(newScale: number, newRadius: number) {
    setScale(newScale)
    setRadius(newRadius)
    if (location) loadDebounced(location.lat, location.lon, newRadius)
  }

  function handleApply() {
    if (location) loadData(location.lat, location.lon, radius)
  }

  function handleRetry() {
    if (lastLoadRef.current) {
      const { lat, lon, radius: rad } = lastLoadRef.current
      loadData(lat, lon, rad)
    }
  }

  // ── Export with preview ──
  function startExport(format: 'svg' | 'pdf' | 'dxf') {
    if (!mapData || !location) return
    const svg = generateSVG(mapData, location.lat, location.lon, scale, pageSize, landscape, layers)
    setPreview({ svg, format })
  }

  async function confirmExport() {
    if (!preview || !mapData || !location) return
    setExporting(true)
    setPreview(null)
    try {
      if (preview.format === 'svg') {
        if (window.electronAPI) {
          const path = await window.electronAPI.exportSVG(preview.svg)
          if (path) showToast('SVG gespeichert')
        } else { downloadString(preview.svg, 'schwarzplan.svg', 'image/svg+xml'); showToast('SVG heruntergeladen') }
      } else if (preview.format === 'pdf') {
        if (window.electronAPI) {
          const path = await window.electronAPI.exportPDF({ svgContent: preview.svg, pageSize, landscape })
          if (path) showToast('PDF gespeichert')
        }
      } else if (preview.format === 'dxf') {
        const dxf = generateDXF(mapData, location.lat, location.lon, layers)
        if (window.electronAPI) {
          const path = await window.electronAPI.exportDXF(dxf)
          if (path) showToast('DXF gespeichert')
        } else { downloadString(dxf, 'schwarzplan.dxf', 'application/dxf'); showToast('DXF heruntergeladen') }
      }
    } finally { setExporting(false) }
  }

  function downloadString(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render ──
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <TektonikLogo size={28} />
          <div className="brand-text">
            <span className="brand-name">TEK TO NIK</span>
            <span className="brand-sub">Schwarzplan</span>
          </div>
        </div>

        {!online && <div className="offline-banner">Keine Internetverbindung</div>}

        <Section title="Adresse" icon={<IconSearch />}>
          <AddressSearch onSelect={handleAddressSelect} loading={loading} />
        </Section>

        <Section title="Bereich" icon={<IconRadius />}>
          <RadiusSlider value={radius} onChange={setRadius} disabled={loading} />
          {location && (
            <button className="apply-btn" onClick={handleApply} disabled={loading}>
              {loading ? 'Wird geladen...' : 'Anwenden'}
            </button>
          )}
        </Section>

        {loading && <div className="loading-bar"><div className="loading-bar-inner" /></div>}

        {stats && (
          <div className="stats">
            <div className="stats-grid">
              <span>{stats.buildings}</span><span>Gebäude</span>
              <span>{stats.roads}</span><span>Straßen</span>
              <span>{stats.water}</span><span>Gewässer</span>
              <span>{stats.green}</span><span>Grünflächen</span>
              <span>{stats.forest}</span><span>Wald</span>
              <span>{stats.railway}</span><span>Eisenbahn</span>
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            {error}
            <button className="retry-btn" onClick={handleRetry}>Erneut versuchen</button>
          </div>
        )}

        <Section title="Kartenstil" icon={<IconMap />} defaultOpen={false}>
          <MapStyleSelector
            value={tileStyle}
            onChange={(id, url) => { setTileStyle(id); setTileUrl(url) }}
          />
        </Section>

        <Section title="Ebenen" icon={<IconLayers />}>
          <LayerToggle
            layers={layers}
            onToggle={(l) => setLayers(prev => ({ ...prev, [l]: !prev[l] }))}
            disabled={loading}
            hasData={mapData !== null}
          />
        </Section>

        <Section title="Export" icon={<IconExport />}>
          <ExportPanel
            disabled={!mapData || exporting}
            exporting={exporting}
            onScaleChange={handleScaleChange}
            currentScale={scale}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            landscape={landscape}
            onLandscapeChange={setLandscape}
            onExportSVG={() => startExport('svg')}
            onExportPDF={() => startExport('pdf')}
            onExportDXF={() => startExport('dxf')}
          />
        </Section>

        <div className="footer-brand">
          <span>tektonik.net</span>
        </div>
      </aside>

      <main className="canvas-area">
        {location && (
          <div className="coord-display">
            {center[0].toFixed(5)}, {center[1].toFixed(5)} | R {radius}m
          </div>
        )}

        {/* Crosshair */}
        <div className="crosshair" />

        <MapView
          center={center}
          zoom={zoom}
          data={mapData}
          visibleLayers={layers}
          exportArea={location ? getRealDimensions(scale, pageSize, landscape) : null}
          tileUrl={tileUrl}
          onMapMove={(c, z) => { setCenter(c); setZoom(z) }}
          onContextClick={(lat, lon) => {
            const result: GeoResult = { lat, lon, displayName: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }
            setLocation(result)
            setCenter([lat, lon])
            const rad = getQueryRadius(scale, pageSize, landscape)
            setRadius(rad)
            loadData(lat, lon, rad)
          }}
        />

        {toast && <div className="toast">{toast}</div>}

        {preview && (
          <ExportPreview
            svgContent={preview.svg}
            pageSize={pageSize}
            landscape={landscape}
            scale={scale}
            onConfirm={confirmExport}
            onCancel={() => setPreview(null)}
          />
        )}
      </main>
    </div>
  )
}
