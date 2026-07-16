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
