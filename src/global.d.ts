interface Window {
  electronAPI: {
    exportPDF: (options: { svgContent: string; pageSize: string; landscape: boolean }) => Promise<string | null>
    exportSVG: (svgContent: string) => Promise<string | null>
    exportDXF: (dxfContent: string) => Promise<string | null>
  }
}
