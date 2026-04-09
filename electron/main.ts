import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Schwarzplan v1.0.0 – TEK TO NIK',
    icon: path.join(__dirname, '..', '..', 'resources', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const isDev = process.argv.includes('--dev')
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // CSP: restrict network to known domains
  const { session } = require('electron')
  session.defaultSession.webRequest.onHeadersReceived((details: any, cb: any) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "connect-src 'self' https://nominatim.openstreetmap.org https://overpass-api.de https://overpass.kumi.systems https://maps.mail.ru https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org; " +
          "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://tektonik.net;"
        ]
      }
    })
  })
  createWindow()
})
app.on('window-all-closed', () => app.quit())

// ── PDF Export ──
// Uses PDFKit + svg-to-pdfkit to convert SVG directly to PDF.
// No hidden BrowserWindow, no printToPDF — pure Node.js conversion.
ipcMain.handle('export-pdf', async (_event, options: {
  svgContent: string
  pageSize: string
  landscape: boolean
}) => {
  if (!mainWindow) return null

  // Paper sizes in points (1 point = 1/72 inch)
  const sizes: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    A3: [841.89, 1190.55],
    A2: [1190.55, 1683.78],
    A1: [1683.78, 2383.94],
    A0: [2383.94, 3370.39]
  }
  const [pw, ph] = sizes[options.pageSize] || sizes.A2
  const width = options.landscape ? ph : pw
  const height = options.landscape ? pw : ph

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'PDF speichern',
    defaultPath: 'schwarzplan.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (result.canceled || !result.filePath) return null

  const PDFDocument = require('pdfkit')
  const SVGtoPDF = require('svg-to-pdfkit')

  const doc = new PDFDocument({
    size: [width, height],
    margin: 0,
    info: {
      Title: 'Schwarzplan',
      Author: 'TEK TO NIK Architekten',
      Creator: 'Schwarzplan App'
    }
  })

  const stream = fs.createWriteStream(result.filePath)
  doc.pipe(stream)

  // White background
  doc.rect(0, 0, width, height).fill('#ffffff')

  // Render SVG into PDF — vector, not raster
  try {
    SVGtoPDF(doc, options.svgContent, 0, 0, {
      width: width,
      height: height,
      preserveAspectRatio: 'xMidYMid meet'
    })
  } catch (err: any) {
    console.error('SVG-to-PDF error:', err.message)
  }

  doc.end()

  // Wait for stream to finish writing
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  return result.filePath
})

// ── SVG Export ──
ipcMain.handle('export-svg', async (_event, svgContent: string) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'SVG speichern',
    defaultPath: 'schwarzplan.svg',
    filters: [{ name: 'SVG', extensions: ['svg'] }]
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, svgContent, 'utf-8')
    return result.filePath
  }
  return null
})

// ── DXF Export ──
ipcMain.handle('export-dxf', async (_event, dxfContent: string) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'DXF speichern',
    defaultPath: 'schwarzplan.dxf',
    filters: [{ name: 'DXF (AutoCAD)', extensions: ['dxf'] }]
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, dxfContent, 'utf-8')
    return result.filePath
  }
  return null
})
