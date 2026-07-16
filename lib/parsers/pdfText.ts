'use client'

// Loads a PDF File/Blob in the browser and returns its text items (with page
// positions) via pdf.js. Used by the grade-card and timetable parsers, which
// both need layout (x/y), not just reading-order text.

import type { TextItem } from './types'

let workerConfigured = false

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
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
