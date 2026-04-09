import { PAPER_SIZES } from './constants'

/**
 * Calculate the Overpass query radius for a given scale + paper size.
 * Uses half-diagonal of the real-world area covered by the paper.
 */
export function getQueryRadius(scale: number, pageSize: string, landscape: boolean): number {
  const paper = PAPER_SIZES[pageSize] || PAPER_SIZES.A2
  const w = landscape ? paper.h : paper.w
  const h = landscape ? paper.w : paper.h
  const realW = (w * scale) / 1000
  const realH = (h * scale) / 1000
  return Math.ceil(Math.sqrt(realW * realW + realH * realH) / 2)
}

/**
 * Get real-world dimensions in meters for a given scale + paper size.
 */
export function getRealDimensions(scale: number, pageSize: string, landscape: boolean): { widthM: number; heightM: number } {
  const paper = PAPER_SIZES[pageSize] || PAPER_SIZES.A2
  const w = landscape ? paper.h : paper.w
  const h = landscape ? paper.w : paper.h
  return { widthM: (w * scale) / 1000, heightM: (h * scale) / 1000 }
}
