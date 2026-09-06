// Shared types for the client-side PDF parsers (grade card, timetable).
// A TextItem is one run of text from pdf.js's getTextContent(), with its
// baseline position on the page — the parsers use x/y layout, not just
// reading-order text, since both source documents are column/grid based.

export interface TextItem {
  x: number
  y: number
  width: number
  str: string
}

export interface PageItems {
  page: number
  items: TextItem[]
}

// One rendered block of colour found in a vertical strip of a page — used to
// recover class-slot timing from calendar-style timetable exports that draw
// a coloured box per class but never print its "HH:MM - HH:MM" as text (the
// box's height *is* the duration). `topY`/`bottomY` are PDF points in the
// page's normal (bottom-up) coordinate space, topY > bottomY.
export interface ColumnRun {
  topY: number
  bottomY: number
}

// Gives the timetable parser's coloured-box fallback access to a rendered
// page. Implemented against a real `<canvas>` (see
// `pdfText.createTimetableRenderSampler`), so tests inject a stub instead —
// parsing logic stays a pure, synchronously-testable function.
export interface TimetableRenderSampler {
  // Coloured blocks found in a vertical strip centred on `xPt` (1-indexed page).
  sampleColumnRuns(page: number, xPt: number): Promise<ColumnRun[]>
  // Y-positions (PDF points) of the grid's own horizontal ruling lines.
  // Needed because export tools don't all draw an hour-of-day label flush
  // with the line it names (see `timetableParser`'s file header) — this is
  // what lets the parser figure out, from the specific PDF in hand, how far
  // off it is, rather than assuming one fixed offset for every export tool.
  detectGridlineYs(page: number): Promise<number[]>
}
