# Schwarzplan Generator

**TEK TO NIK Architekten** — Desktop application for generating architectural figure-ground plans (Schwarzpläne) from OpenStreetMap data.

![Electron](https://img.shields.io/badge/Electron-41-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900)

## Features

- **Interactive Map** — Leaflet-based map with pan, zoom, fly-to navigation
- **Address Search** — Nominatim geocoding, type an address and the map flies there
- **6 Layer Types** — Buildings, Roads, Water, Green spaces, Forest, Railway — toggle each on/off
- **4 Map Styles** — Light, Dark, OSM, None (blank background)
- **3 Export Formats** — SVG (vector, scale-accurate), PDF (vector via PDFKit), DXF (AutoCAD-compatible)
- **Scale Selection** — 1:200, 1:500, 1:1.000, 1:2.000
- **Paper Sizes** — A0 through A4, portrait and landscape
- **Export Preview** — Preview the schwarzplan before exporting
- **Right-Click Context** — Right-click anywhere on the map to generate a schwarzplan at that point
- **Export Area Indicator** — Red dashed rectangle shows the exact export area on the map
- **Scale Bar, North Arrow, Title Block** — Professional cartographic elements in SVG/PDF output
- **Overpass API** — Fetches building/road/water data from OpenStreetMap with 3 mirror servers and automatic retry
- **Query Cache** — 5-minute cache prevents redundant API calls
- **Offline Detection** — Warns when internet connection is lost
- **Keyboard Shortcuts** — Ctrl+E (SVG), Ctrl+P (PDF), Ctrl+D (DXF), Enter (select first search result)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 41 |
| UI | React 19 + TypeScript |
| Build | Vite 7 |
| Map | Leaflet |
| Geocoding | Nominatim (OpenStreetMap) |
| Map Data | Overpass API |
| PDF | PDFKit + svg-to-pdfkit |
| Packaging | electron-builder |

## Getting Started

```bash
# Install dependencies
npm install

# Development (2 terminals)
npm run dev:renderer    # Vite dev server
npm run dev:electron    # Electron app

# Or both at once
npm run dev

# Production build
npm run build

# Package as portable EXE
npm run dist
```

## Project Structure

```
src/
├── components/
│   ├── AddressSearch.tsx    # Nominatim address search with autocomplete
│   ├── ExportPanel.tsx      # Scale, paper size, format selection
│   ├── ExportPreview.tsx    # Preview modal before export
│   ├── Icons.tsx            # Inline SVG icons
│   ├── LayerToggle.tsx      # 6-layer visibility toggles
│   ├── MapStyleSelector.tsx # Light/Dark/OSM/None tile selection
│   ├── MapView.tsx          # Leaflet map with GeoJSON overlays
│   ├── RadiusSlider.tsx     # Query radius control
│   ├── Section.tsx          # Collapsible sidebar sections
│   └── TektonikLogo.tsx     # Brand logo
├── services/
│   ├── constants.ts         # Shared constants (paper sizes, colors, timeouts)
│   ├── dxfExport.ts         # DXF file generation (AutoCAD)
│   ├── geo.ts               # Shared projection/coordinate utilities
│   ├── geocoding.ts         # Nominatim API client
│   ├── overpass.ts          # Overpass API client with cache + retry
│   ├── scaleHelper.ts       # Scale/radius calculations
│   └── svgExport.ts         # SVG file generation (vector, scale-accurate)
├── styles/
│   └── app.css
└── App.tsx                  # Main application

electron/
├── main.ts                  # Electron main process (PDF/SVG/DXF export, CSP)
└── preload.ts               # IPC bridge
```

## Security

- **Content Security Policy** — Restricts network access to known domains only
- **XSS Protection** — All coordinates validated with `isSafeCoord()` before SVG/DXF injection
- **Input Validation** — Nominatim and Overpass responses are type-checked and validated
- **Context Isolation** — Electron runs with `contextIsolation: true`, `nodeIntegration: false`

## Data Sources

- [OpenStreetMap](https://www.openstreetmap.org/) — Map data (ODbL license)
- [Overpass API](https://overpass-api.de/) — Building/road/water queries
- [Nominatim](https://nominatim.openstreetmap.org/) — Geocoding
- [CARTO](https://carto.com/) — Base map tiles

## License

ISC

---

**TEK TO NIK Architekten** — [tektonik.net](https://tektonik.net)
