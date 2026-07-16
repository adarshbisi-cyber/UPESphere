'use client'

// Shared extraction path for the onboarding Curriculum step: a text-based PDF
// is parsed for free via pdf.js (position-reconstructed lines fed through the
// existing OCR subject parser, which already handles this exact table shape).
// A scanned PDF or an image screenshot falls back to the existing tesseract
// OCR path used by the standalone Curriculum Scanner.

import { extractPdfTextItems, hasExtractableText } from './pdfText'
import { pagesToLines } from './textLines'
import { parseSubjectsFromOCR, type ParsedSubject } from '@/lib/curriculum-parser'

export interface CurriculumExtractResult {
  subjects: ParsedSubject[]
  method: 'pdf-text' | 'ocr'
}

export async function extractCurriculumSubjects(file: File): Promise<CurriculumExtractResult> {
  if (file.type === 'application/pdf') {
    const pages = await extractPdfTextItems(file)
    if (hasExtractableText(pages)) {
      const lines = pagesToLines(pages)
      const subjects = parseSubjectsFromOCR(lines.join('\n'), new Set())
      if (subjects.length > 0) return { subjects, method: 'pdf-text' }
    }
  }

  // Image screenshot, or a scanned PDF with no embedded text — OCR it.
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1)
  try {
    const { data } = await worker.recognize(file)
    const subjects = parseSubjectsFromOCR(data.text, new Set())
    return { subjects, method: 'ocr' }
  } finally {
    await worker.terminate()
  }
}
