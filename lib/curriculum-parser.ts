// Pure parser that turns OCR text from a curriculum/ERP screenshot into a list
// of subjects + credits. Kept framework-free (no React) so it can be unit-tested
// directly. Used by components/calculators/CurriculumScanner.tsx.

import { generateId } from '@/lib/utils'

export interface ParsedSubject {
  id: string
  name: string
  credits: number
  selected: boolean
  confidence: 'high' | 'low'
}

const CODE_RE = /[A-Z]{2,8}-?\d+[_-]?\d*/

// A course code anchored at the start of a line (e.g. "STGM8002_3 ...").
const CODE_ANCHOR = new RegExp('^\\s*(' + CODE_RE.source + ')\\b')

// A table row's numeric tail: the FIRST 1-9 integer is the credit; any further
// integers are other columns (available seats, cohort counts, etc.). The name
// is everything before the credit. Handles "Project Management 3 0" (credit 3,
// not seats 0) and "3 0" (no inline name — a wrapped row's code line).
const ROW_RE = /^(.*?)\s*\b([1-9](?:\.\d)?)\b(?:\s+\d+(?:\.\d)?)*\s*$/

const TRAILING_TYPE_RE = new RegExp(
  '\\s+(' +
  [
    'Non[\\s-]Time[\\s-]Table',
    'Open\\s+Elective',
    'Professional\\s+Elective',
    'Project\\s+Work',
    'Community\\s+Service',
    'Audit\\s+Course',
    'Value\\s+Added',
    'Dissertation',
    'Internship',
    'Elective',
    'Tutorial',
    'Seminar',
    'Core',
    'Lab',
  ].join('|') +
  ')\\s*$',
  'i'
)

export function cleanCourseName(raw: string): string {
  const step1 = raw
    .replace(new RegExp(`^${CODE_RE.source}\\s+`), '')
    .replace(new RegExp(`\\s*\\(${CODE_RE.source}\\)\\s*`, 'g'), ' ')
    .replace(new RegExp(`\\s+${CODE_RE.source}$`), '')
    .replace(/^\d{1,3}[\s.)]+/, '')
    .replace(/\|/g, '')
    .replace(/_+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const step2 = step1.replace(TRAILING_TYPE_RE, '').trim()
  return step2.length >= 3 ? step2 : step1
}

const SKIP_PATTERNS = [
  /^[-=|+#*]+$/,
  /^(sl\.?\s*no|s\.?\s*no|course\s*code|subject\s*name|credits?|l\s*t\s*p|hours?|subject\s*code|total|remarks|grade|semester|theory|practical)/i,
  /^\d{1,2}\.?\s*$/,
  /^(page\s*\d|www\.|http)/i,
]

interface OcrLine {
  text: string
  code: string | null
  name: string // inline name (text before the credit), may be empty
  credits: number | null
  hasLetters: boolean
  skip: boolean
}

function classifyLine(text: string): OcrLine {
  const skip = SKIP_PATTERNS.some(p => p.test(text))
  const codeM = text.match(CODE_ANCHOR)
  const code = codeM ? codeM[1] : null
  const afterCode = code ? text.slice(codeM![0].length).trim() : text
  const rowM = afterCode.match(ROW_RE)
  return {
    text,
    code,
    name: rowM ? rowM[1].trim() : afterCode,
    credits: rowM ? Math.round(parseFloat(rowM[2])) : null,
    hasLetters: /[a-zA-Z]{2,}/.test(text),
    skip,
  }
}

export function parseSubjectsFromOCR(rawText: string, seen: Set<string>): ParsedSubject[] {
  const lines = rawText
    .split('\n')
    .map(l => l.trim().replace(/\s+/g, ' '))
    .filter(l => l.length >= 2)

  const parsed = lines.map(classifyLine)
  const results: ParsedSubject[] = []
  const consumed = new Set<number>()

  const addResult = (name: string, credits: number, confidence: 'high' | 'low') => {
    const cleaned = cleanCourseName(name)
    const key = cleaned.toLowerCase().replace(/\s+/g, '')
    if (
      cleaned.length >= 3 &&
      /[a-zA-Z]{2,}/.test(cleaned) &&
      credits >= 1 && credits <= 9 &&
      !seen.has(key)
    ) {
      seen.add(key)
      results.push({ id: generateId(), name: cleaned, credits, selected: true, confidence })
    }
  }

  // A "fragment" is a leftover text line with no code and no credit — i.e. a
  // wrapped course name spilling onto its own row (e.g. "Restructuring").
  const isFrag = (i: number) => {
    const l = parsed[i]
    return !!l && !l.skip && !consumed.has(i) && l.credits === null && l.code === null && l.hasLetters
  }

  for (let i = 0; i < parsed.length; i++) {
    const l = parsed[i]
    if (l.skip || consumed.has(i) || l.credits === null) continue

    // Row with a usable inline name → straightforward single-line entry.
    const inline = cleanCourseName(l.name)
    if (inline.length >= 3 && /[a-zA-Z]{2,}/.test(inline)) {
      addResult(l.name, l.credits, 'high')
      consumed.add(i)
      continue
    }

    // Row whose name is empty/too short → the name wrapped and OCR stranded the
    // code+credits on its own line. Stitch the adjacent name fragments back on,
    // preserving reading order (parts above the code line, then below).
    const before: number[] = []
    for (let j = i - 1; j >= 0 && isFrag(j); j--) before.unshift(j)
    const after: number[] = []
    for (let j = i + 1; j < parsed.length && isFrag(j); j++) after.push(j)

    const parts: string[] = []
    for (const j of before) { parts.push(parsed[j].text); consumed.add(j) }
    for (const j of after) { parts.push(parsed[j].text); consumed.add(j) }
    consumed.add(i)

    if (parts.length > 0) addResult(parts.join(' '), l.credits, 'low')
  }

  // Fallback: if the structured pass found almost nothing, try a loose scan so
  // an unusual layout still yields something rather than zero subjects.
  if (results.length < 1) {
    for (const line of lines) {
      if (SKIP_PATTERNS.some(p => p.test(line))) continue
      const m = line.match(/([A-Za-z][A-Za-z\s&,:()\-–]{3,60}?)\s+([1-9])\b/)
      if (m) addResult(m[1], parseInt(m[2]), 'low')
    }
  }

  return results.slice(0, 40)
}
