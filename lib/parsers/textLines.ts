// Reconstructs reading-order text lines from pdf.js text items using their
// x/y positions, rather than trusting the PDF's own content-stream order
// (which for column layouts often interleaves rows/columns unpredictably).
// Shared by any parser that wants a clean "one line per visual row" string —
// e.g. feeding a curriculum PDF through the existing OCR-oriented subject
// parser, which already handles that table format well.

import type { TextItem } from './types'

const ROW_Y_TOLERANCE = 2 // pt — same visual row despite baseline micro-shifts

export function groupIntoRows(items: TextItem[]): TextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: TextItem[][] = []
  for (const item of sorted) {
    const row = rows.find(r => Math.abs(r[0].y - item.y) <= ROW_Y_TOLERANCE)
    if (row) row.push(item)
    else rows.push([item])
  }
  // Items are grouped in y-descending order; within a row, baseline micro-shifts
  // mean grouping order isn't reliably x-ascending, so re-sort now that row
  // membership is settled.
  for (const row of rows) row.sort((a, b) => a.x - b.x)
  return rows
}

export function pagesToLines(pages: TextItem[][]): string[] {
  const items = pages.flat().filter(i => i.str.trim().length > 0)
  const rows = groupIntoRows(items)
  return rows.map(row => row.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim())
}
