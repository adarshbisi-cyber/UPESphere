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

// Letters (case-insensitive — OCR routinely misreads a code's case, e.g.
// "SIIB8101_2" -> "SlIB8101_2") + course number + an optional single variant
// letter (e.g. the "P" in "STGM8025P_3") + an optional credit suffix (some
// institutions' codes don't encode credits at all, e.g. plain "CS101").
const CODE_RE = /[A-Za-z]{2,8}\d{2,6}[A-Za-z]?(?:[_-]\d{1,2})?/

// A course code anchored at the start of a line (e.g. "STGM8002_3 ...").
const CODE_ANCHOR = new RegExp('^\\s*(' + CODE_RE.source + ')\\b')

// A table row's numeric tail: the FIRST 1-9 integer is the credit; any further
// integers are other columns (available seats, cohort counts, etc.). The name
// is everything before the credit. Handles "Project Management 3 0" (credit 3,
// not seats 0) and "3 0" (no inline name — a wrapped row's code line).
//
// This is only a fallback — whenever the course code is recognised, its own
// trailing "_N" suffix is the authoritative credit value (see creditFromCode),
// because a course title can itself end in a bare number ("Job Ready Boot
// Camp 2"), which this first-1-9-digit heuristic would otherwise misread as
// the credit.
const ROW_RE = /^(.*?)\s*\b([1-9](?:\.\d)?)\b(?:\s+\d+(?:\.\d)?)*\s*$/

// Extracts the credit value from a recognised code's "_N" / "-N" suffix.
function creditFromCode(code: string): number | null {
  const m = code.match(/[_-](\d{1,2})$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return n >= 1 && n <= 9 ? n : null
}

// Matches a row's text against a KNOWN credit value (from the code), rather
// than guessing which trailing digit is the credit. Anchors on the credit as
// its own token so a title that itself ends in a number ("Boot Camp 2") is
// kept intact as the name instead of being mistaken for the credit.
function matchRowWithKnownCredit(text: string, credit: number): { name: string } | null {
  const re = new RegExp(`^(.*?)\\s*\\b${credit}\\b(?:\\s+\\d+(?:\\.\\d)?)*\\s*$`)
  const m = text.match(re)
  return m ? { name: m[1].trim() } : null
}

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
    // Deliberately NOT "Internship" — real course titles commonly end with
    // it verbatim ("Summer Internship", "Industry Internship"), so treating
    // it as a strippable type-label truncated those titles down to nonsense.
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
  looksLikeContinuation: boolean // starts mid-phrase (lowercase) — a wrapped middle fragment, not a title
  hasLetters: boolean
  skip: boolean
}

function classifyLine(text: string): OcrLine {
  const skip = SKIP_PATTERNS.some(p => p.test(text))
  const codeM = text.match(CODE_ANCHOR)
  const code = codeM ? codeM[1] : null
  const afterCode = code ? text.slice(codeM![0].length).trim() : text

  // Prefer the code's own credit suffix when present — it's authoritative,
  // unlike guessing from the row's trailing digits (a title can itself end
  // in a number, e.g. "Job Ready Boot Camp 2").
  const knownCredit = code ? creditFromCode(code) : null
  const known = knownCredit !== null ? matchRowWithKnownCredit(afterCode, knownCredit) : null
  const rowM = known ? null : afterCode.match(ROW_RE)

  const name = known ? known.name : rowM ? rowM[1].trim() : afterCode
  const credits = known ? knownCredit : rowM ? Math.round(parseFloat(rowM[2])) : null

  return {
    text,
    code,
    name,
    credits,
    looksLikeContinuation: /^[a-z]/.test(name),
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

  // A line ending in a hyphen is a hyphenated word split across the line
  // wrap ("Firms-" / "based") — rejoin without a space; otherwise join words
  // with one.
  const joinFragments = (parts: string[]): string =>
    parts.reduce((acc, part) => {
      if (!acc) return part
      // Keep the hyphen itself (it's part of the compound word, e.g.
      // "Firms-based") — just don't insert a space after it.
      return /-$/.test(acc) ? acc + part : `${acc} ${part}`
    }, '')

  for (let i = 0; i < parsed.length; i++) {
    const l = parsed[i]
    if (l.skip || consumed.has(i) || l.credits === null) continue

    // Row with a usable, complete-looking inline name → straightforward
    // single-line entry.
    const inline = cleanCourseName(l.name)
    if (inline.length >= 3 && /[a-zA-Z]{2,}/.test(inline) && !l.looksLikeContinuation) {
      addResult(l.name, l.credits, 'high')
      consumed.add(i)
      continue
    }

    // Otherwise the title wrapped across lines: either this row's name is
    // empty/too short (OCR stranded the code+credits on their own line), or
    // it starts mid-phrase (the code line also carries the wrapped title's
    // middle chunk, e.g. "STGM8026_3 based in Emerging Market 3 0"). Stitch
    // the adjacent fragment lines — and this row's own inline text, if any —
    // back together in reading order.
    // Capped at 1 line each way: a wrapped title spills onto at most one
    // extra line per side in this table format. Without the cap, a greedy
    // scan runs straight through into the NEXT subject's own wrapped-name
    // fragments once it hits its stranded code line, merging two subjects
    // into one garbled entry.
    const MAX_FRAGMENT_LINES = 1
    const before: number[] = []
    for (let j = i - 1; j >= 0 && isFrag(j) && before.length < MAX_FRAGMENT_LINES; j--) before.unshift(j)
    const after: number[] = []
    for (let j = i + 1; j < parsed.length && isFrag(j) && after.length < MAX_FRAGMENT_LINES; j++) after.push(j)

    const parts: string[] = []
    for (const j of before) { parts.push(parsed[j].text); consumed.add(j) }
    if (l.name.trim()) parts.push(l.name.trim())
    for (const j of after) { parts.push(parsed[j].text); consumed.add(j) }
    consumed.add(i)

    if (parts.length > 0) addResult(joinFragments(parts), l.credits, 'low')
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
