'use client'

// Loads a PDF File/Blob in the browser and returns its text items (with page
// positions) via pdf.js. Used by the grade-card and timetable parsers, which
// both need layout (x/y), not just reading-order text.

import type { ColumnRun, TextItem, TimetableRenderSampler } from './types'

let workerConfigured = false

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  if (!workerConfigured) {
    // Served as-is from /public (not run through webpack/Terser) — the worker
    // file is native ESM, which breaks Next.js's minifier if webpack tries to
    // bundle it via `new URL(..., import.meta.url)` asset resolution instead.
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    workerConfigured = true
  }
  return pdfjs
}

export async function extractPdfTextItems(file: File | Blob): Promise<TextItem[][]> {
  const pdfjs = await getPdfJs()
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const pages: TextItem[][] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    pages.push(
      content.items.map((it): TextItem => {
        // pdf.js text items are TextItem | TextMarkedContent; only the former has `str`/`transform`.
        const ti = it as { str: string; width: number; transform: number[] }
        return { x: ti.transform[4], y: ti.transform[5], width: ti.width, str: ti.str }
      })
    )
  }
  await doc.destroy()
  return pages
}

/** True if the PDF has extractable text (i.e. isn't a scanned image). */
export function hasExtractableText(pages: TextItem[][]): boolean {
  const totalChars = pages.flat().reduce((n, i) => n + i.str.trim().length, 0)
  return totalChars > 20
}

// Some calendar-app timetable exports (e.g. a printed weekly view) never
// render "HH:MM - HH:MM" as text at all — each class is just a coloured box
// with the subject/room text inside it, and the box's *height* is the only
// record of how long the class runs. `timetableParser`'s regex path can't
// recover that, so it falls back to asking a `TimetableRenderSampler` (built
// here) to render the page and report where the coloured boxes actually are
// (`sampleColumnRuns`) and where the grid's own ruling lines fall
// (`detectGridlineYs`) — the latter is what lets `timetableParser` figure
// out where each hour-of-day *label* actually points, since export tools
// don't all draw the label flush with the line it names.
const RENDER_SCALE = 2 // px per pt — enough resolution to place edges within ~1-2min
const BAND_HALF_WIDTH_PT = 25 // sample strip half-width; day columns are >60pt apart (COLUMN_GAP)
const MIN_RUN_PT = 10 // discard slivers thinner than this (anti-aliased edges, stray strokes)
const MAX_GAP_PT = 4 // bridge gaps this small (a glyph or hairline crossing the strip)
const CONTENT_ROW_THRESHOLD = 0.3 // fraction of the strip's width that must be "content" for a row to count
const GRIDLINE_ROW_THRESHOLD = 0.6 // fraction of the *whole page width* that must look like ruling for a row to count
const GRIDLINE_SAMPLE_STRIDE = 4 // px — full-width scan, so subsample columns for speed

// A pixel counts as page background/gridline (not part of a coloured event
// box) if it's near-white, or if it's a low-saturation grey — timetable
// grids draw hour/day divider lines in light grey, which must not be mistaken
// for the bottom of a class box.
function isBackgroundish(r: number, g: number, b: number): boolean {
  const lightness = 0.299 * r + 0.587 * g + 0.114 * b
  if (lightness > 235) return true
  const isGreyish = Math.max(r, g, b) - Math.min(r, g, b) < 12
  return isGreyish && lightness > 195
}

// A pixel looks like a ruling line: light grey, distinctly not white and not
// a saturated event-box colour. Deliberately narrower than `isBackgroundish`
// (which also accepts pure white) — this one has to positively identify the
// line, not just rule out a coloured box.
function isGridlineish(r: number, g: number, b: number): boolean {
  const lightness = 0.299 * r + 0.587 * g + 0.114 * b
  const isGreyish = Math.max(r, g, b) - Math.min(r, g, b) < 12
  return isGreyish && lightness > 190 && lightness < 250
}

type PageBitmap = { ctx: CanvasRenderingContext2D; width: number; height: number; pageHeightPt: number }

/**
 * Builds a `TimetableRenderSampler` bound to one PDF file. Renders each page
 * to an off-screen canvas at most once (cached), so repeated calls for
 * different day columns — or the gridline scan — on the same page stay cheap.
 */
export function createTimetableRenderSampler(file: File | Blob): TimetableRenderSampler {
  let docPromise: ReturnType<typeof loadDoc> | null = null
  const bitmaps = new Map<number, PageBitmap>()

  async function loadDoc() {
    const pdfjs = await getPdfJs()
    const buf = await file.arrayBuffer()
    return pdfjs.getDocument({ data: buf }).promise
  }

  async function getBitmap(pageNum: number): Promise<PageBitmap> {
    const cached = bitmaps.get(pageNum)
    if (cached) return cached
    if (!docPromise) docPromise = loadDoc()
    const doc = await docPromise
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: RENDER_SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('2D canvas context unavailable')
    await page.render({ canvasContext: ctx, viewport }).promise
    const entry = { ctx, width: canvas.width, height: canvas.height, pageHeightPt: viewport.height / RENDER_SCALE }
    bitmaps.set(pageNum, entry)
    return entry
  }

  // Collapses a boolean-per-row array into contiguous [start, end] pixel runs.
  function toRuns(rowMatches: boolean[]): Array<[number, number]> {
    const runs: Array<[number, number]> = []
    let start = -1
    for (let row = 0; row < rowMatches.length; row++) {
      if (rowMatches[row] && start === -1) start = row
      if (!rowMatches[row] && start !== -1) { runs.push([start, row - 1]); start = -1 }
    }
    if (start !== -1) runs.push([start, rowMatches.length - 1])
    return runs
  }

  return {
    async sampleColumnRuns(pageNum: number, xPt: number): Promise<ColumnRun[]> {
      try {
        const { ctx, width, height, pageHeightPt } = await getBitmap(pageNum)
        const x0 = Math.max(0, Math.round((xPt - BAND_HALF_WIDTH_PT) * RENDER_SCALE))
        const x1 = Math.min(width, Math.round((xPt + BAND_HALF_WIDTH_PT) * RENDER_SCALE))
        const bandWidthPx = x1 - x0
        if (bandWidthPx <= 0) return []

        const { data } = ctx.getImageData(x0, 0, bandWidthPx, height)
        const rowIsFilled: boolean[] = new Array(height).fill(false)
        for (let row = 0; row < height; row++) {
          let contentPx = 0
          const rowStart = row * bandWidthPx * 4
          for (let col = 0; col < bandWidthPx; col++) {
            const idx = rowStart + col * 4
            if (!isBackgroundish(data[idx], data[idx + 1], data[idx + 2])) contentPx++
          }
          rowIsFilled[row] = contentPx / bandWidthPx >= CONTENT_ROW_THRESHOLD
        }

        // Bridge small gaps (a glyph stroke or hairline briefly dipping below
        // threshold shouldn't split one class box into two).
        const maxGapPx = MAX_GAP_PT * RENDER_SCALE
        const merged: Array<[number, number]> = []
        for (const run of toRuns(rowIsFilled)) {
          const prev = merged[merged.length - 1]
          if (prev && run[0] - prev[1] <= maxGapPx) prev[1] = run[1]
          else merged.push(run)
        }

        const minRunPx = MIN_RUN_PT * RENDER_SCALE
        return merged
          .filter(([a, b]) => b - a >= minRunPx)
          .map(([a, b]) => ({
            // Canvas rows count down from the top; PDF points count up from
            // the bottom, so flip back into page space.
            topY: pageHeightPt - a / RENDER_SCALE,
            bottomY: pageHeightPt - b / RENDER_SCALE,
          }))
      } catch {
        // Rendering is a best-effort enhancement — if it fails (unsupported
        // environment, corrupt page), the caller falls back to no slots for
        // this column rather than crashing the whole parse.
        return []
      }
    },

    async detectGridlineYs(pageNum: number): Promise<number[]> {
      try {
        const { ctx, width, height, pageHeightPt } = await getBitmap(pageNum)
        const { data } = ctx.getImageData(0, 0, width, height)
        const rowIsGridline: boolean[] = new Array(height).fill(false)
        const samplesPerRow = Math.ceil(width / GRIDLINE_SAMPLE_STRIDE)
        for (let row = 0; row < height; row++) {
          let matches = 0
          const rowStart = row * width * 4
          for (let x = 0; x < width; x += GRIDLINE_SAMPLE_STRIDE) {
            const idx = rowStart + x * 4
            if (isGridlineish(data[idx], data[idx + 1], data[idx + 2])) matches++
          }
          rowIsGridline[row] = matches / samplesPerRow >= GRIDLINE_ROW_THRESHOLD
        }
        // Each ruling line renders as a couple of adjacent rows at this
        // scale — report the run's centre as the line's true y.
        return toRuns(rowIsGridline).map(([a, b]) => pageHeightPt - (a + b) / 2 / RENDER_SCALE)
      } catch {
        return []
      }
    },
  }
}
