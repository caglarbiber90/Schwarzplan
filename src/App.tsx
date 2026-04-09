import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import AddressSearch from './components/AddressSearch'
import ExportPanel from './components/ExportPanel'
import MapView from './components/MapView'
import LayerToggle from './components/LayerToggle'
import TektonikLogo from './components/TektonikLogo'
import MapStyleSelector from './components/MapStyleSelector'
import Section from './components/Section'
import ExportPreview from './components/ExportPreview'
import { IconSearch, IconLayers, IconExport, IconMap } from './components/Icons'
import { GeoResult } from './services/geocoding'
import { fetchMapData, OverpassData, LayerType } from './services/overpass'
import { getQueryRadius, getRealDimensions } from './services/scaleHelper'
import { generateSVG } from './services/svgExport'
import { generateDXF } from './services/dxfExport'
import { OVERPASS_CLIENT_TIMEOUT } from './services/constants'

const DEFAULT_CENTER: [number, number] = [50.1109, 8.6821]
const DEFAULT_ZOOM = 15

export default function App() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [scale, setScale] = useState(1000)
  const [pageSize, setPageSize] = useState('A2')
  const [landscape, setLandscape] = useState(true)
  const [mapData, setMapData] = useState<OverpassData | null>(null)
  const [loading, setLoading] = useState(false)
  const [locked, setLocked] = useState(false) // area locked after capture
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [tileStyle, setTileStyle] = useState('light')
  const [tileUrl, setTileUrl] = useState('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png')
  const [exporting, setExporting] = useState(false)
  const [preview, setPreview] = useState<{ svg: string; format: 'svg' | 'pdf' | 'dxf' } | null>(null)
  const [layers, setLayers] = useState<Record<LayerType, boolean>>({
    building: true, road: true, water: true,
    green: true, forest: true, railway: true
  })

  const abortRef = useRef<AbortController | null>(null)
  const lockedCenter = useRef<[number, number]>(DEFAULT_CENTER)

  const exportArea = useMemo(() => getRealDimensions(scale, pageSize, landscape), [scale, pageSize, landscape])
  const queryRadius = useMemo(() => getQueryRadius(scale, pageSize, landscape), [scale, pageSize, landscape])

  // Online/offline
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => { setOnline(false); showToast('Keine Internetverbindung') }
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (preview) return
      if (e.key === ' ' && !e.ctrlKey && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        if (locked) handleRelease(); else handleCapture()
      }
      if (e.ctrlKey && e.key === 'e' && locked) { e.preventDefault(); startExport('svg') }
      if (e.ctrlKey && e.key === 'p' && locked) { e.preventDefault(); startExport('pdf') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stats = useMemo(() => {
    if (!mapData) return null
    return {
      buildings: mapData.buildings.length, roads: mapData.roads.length,
      water: mapData.water.length, green: mapData.green.length,
      forest: mapData.forest.length, railway: mapData.railway.length
    }
  }, [mapData])

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  // Data loading
  const loadData = useCallback(async (lat: number, lon: number, rad: number) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), OVERPASS_CLIENT_TIMEOUT)
    setLoading(true); setError(null)
    try {
      const data = await fetchMapData(lat, lon, rad, controller.signal)
      setMapData(data)
      if (data.buildings.length === 0) showToast('Keine Gebäude in diesem Bereich gefunden.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kartendaten')
      setMapData(null)
    } finally { clearTimeout(timeout); setLoading(false) }
  }, [])

  // Handlers
  function handleAddressSelect(result: GeoResult) {
    if (locked) return // can't move when locked
    setCenter([result.lat, result.lon]); setZoom(16)
  }

  /** CAPTURE: lock area + load data */
  function handleCapture() {
    if (loading) return
    lockedCenter.current = center
    setLocked(true)
    loadData(center[0], center[1], queryRadius)
  }

  /** RELEASE: unlock area, clear data */
  function handleRelease() {
    setLocked(false)
    setMapData(null)
  }

  function handleScaleChange(newScale: number) {
    setScale(newScale)
    // If locked, reload with new scale
    if (locked) {
      const newRadius = getQueryRadius(newScale, pageSize, landscape)
      loadData(lockedCenter.current[0], lockedCenter.current[1], newRadius)
    }
  }

  function handleRetry() {
    loadData(lockedCenter.current[0], lockedCenter.current[1], queryRadius)
  }

  // Export
  function startExport(format: 'svg' | 'pdf' | 'dxf') {
    if (!mapData) return
    const c = lockedCenter.current
    const svg = generateSVG(mapData, c[0], c[1], scale, pageSize, landscape, layers)
    setPreview({ svg, format })
  }

  async function confirmExport() {
    if (!preview || !mapData) return
    setExporting(true); setPreview(null)
    try {
      const c = lockedCenter.current
      if (preview.format === 'svg') {
        if (window.electronAPI) { const p = await window.electronAPI.exportSVG(preview.svg); if (p) showToast('SVG gespeichert') }
        else { dl(preview.svg, 'schwarzplan.svg', 'image/svg+xml'); showToast('SVG heruntergeladen') }
      } else if (preview.format === 'pdf') {
        if (window.electronAPI) { const p = await window.electronAPI.exportPDF({ svgContent: preview.svg, pageSize, landscape }); if (p) showToast('PDF gespeichert') }
      } else if (preview.format === 'dxf') {
        const dxf = generateDXF(mapData, c[0], c[1], layers)
        if (window.electronAPI) { const p = await window.electronAPI.exportDXF(dxf); if (p) showToast('DXF gespeichert') }
        else { dl(dxf, 'schwarzplan.dxf', 'application/dxf'); showToast('DXF heruntergeladen') }
      }
    } finally { setExporting(false) }
  }

  function dl(content: string, filename: string, mime: string) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type: mime }))
    a.download = filename; a.click(); URL.revokeObjectURL(a.href)
  }

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

        {/* 1. Address — navigation only */}
        <Section title="Adresse" icon={<IconSearch />} defaultOpen={!locked}>
          <AddressSearch onSelect={handleAddressSelect} loading={loading || locked} />
        </Section>

        {/* 2. Scale + Paper — always visible, choose BEFORE capture */}
        {!locked && (
          <Section title="Export-Einstellungen" icon={<IconExport />} defaultOpen={true}>
            <ExportPanel
              disabled={false}
              exporting={false}
              onScaleChange={(s) => handleScaleChange(s)}
              currentScale={scale}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              landscape={landscape}
              onLandscapeChange={setLandscape}
              onExportSVG={() => {}}
              onExportPDF={() => {}}
              onExportDXF={() => {}}
              hideExportButtons={true}
            />
          </Section>
        )}

        {/* 3. CAPTURE / RELEASE */}
        {!locked ? (
          <button className="capture-btn" onClick={handleCapture} disabled={loading}>
            {loading ? <><span className="capture-spinner" /> Wird geladen...</> : 'Bereich erfassen'}
          </button>
        ) : (
          <button className="release-btn" onClick={handleRelease} disabled={loading}>
            Bereich freigeben
          </button>
        )}

        {!locked && (
          <p className="capture-hint">Rahmen positionieren, dann erfassen. <kbd>Leertaste</kbd></p>
        )}

        {loading && <div className="loading-bar"><div className="loading-bar-inner" /></div>}

        {/* 4. After capture — stats */}
        {stats && (
          <div className="stats">
            <div className="stats-grid">
              <span>{stats.buildings}</span><span>Gebäude</span>
              <span>{stats.roads}</span><span>Straßen</span>
              <span>{stats.water}</span><span>Gewässer</span>
              {stats.green > 0 && <><span>{stats.green}</span><span>Grünflächen</span></>}
              {stats.forest > 0 && <><span>{stats.forest}</span><span>Wald</span></>}
              {stats.railway > 0 && <><span>{stats.railway}</span><span>Eisenbahn</span></>}
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            {error}
            <button className="retry-btn" onClick={handleRetry}>Erneut versuchen</button>
          </div>
        )}

        {/* 5. After capture — Kartenstil + Ebenen + Export buttons */}
        {locked && (
          <>
            <Section title="Kartenstil" icon={<IconMap />} defaultOpen={false}>
              <MapStyleSelector
                value={tileStyle}
                onChange={(id, url) => { setTileStyle(id); setTileUrl(url) }}
              />
            </Section>

            <Section title="Ebenen" icon={<IconLayers />} defaultOpen={true}>
              <LayerToggle
                layers={layers}
                onToggle={(l) => setLayers(prev => ({ ...prev, [l]: !prev[l] }))}
                disabled={loading}
                hasData={mapData !== null}
              />
            </Section>

            <Section title="Export" icon={<IconExport />} defaultOpen={true}>
              <ExportPanel
                disabled={!mapData || exporting}
                exporting={exporting}
                onScaleChange={(s) => handleScaleChange(s)}
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
          </>
        )}

        <div className="footer-brand"><span>tektonik.net</span></div>
      </aside>

      <main className="canvas-area">
        <div className="coord-display">
          {center[0].toFixed(5)}, {center[1].toFixed(5)} | M 1:{scale} | {pageSize}{landscape ? ' quer' : ''}
          {locked && ' | 🔒'}
        </div>

        {!locked && <div className="crosshair" />}

        <MapView
          center={center}
          zoom={zoom}
          data={mapData}
          visibleLayers={layers}
          exportArea={exportArea}
          tileUrl={tileUrl}
          locked={locked}
          onMapMove={(c, z) => { if (!locked) { setCenter(c); setZoom(z) } }}
          onContextClick={(lat, lon) => {
            if (locked) return
            setCenter([lat, lon])
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
