import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  exportPDF: (options: { svgContent: string; pageSize: string; landscape: boolean }) =>
    ipcRenderer.invoke('export-pdf', options),
  exportSVG: (svgContent: string) =>
    ipcRenderer.invoke('export-svg', svgContent),
  exportDXF: (dxfContent: string) =>
    ipcRenderer.invoke('export-dxf', dxfContent)
})
