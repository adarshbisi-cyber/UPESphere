// Parses a text-based (non-scanned) university grade card PDF into structured
// data. Works off pdf.js text-item positions rather than raw reading order,
// since the source is a column table (Course Code | Course Name | Credits |
// Grade | Result) that pdf.js otherwise flattens into interleaved runs.
//
// Column positions are detected from the header row itself (not hardcoded),
// so small template shifts (different margins) don't break the parse. Falls
// back to a row-regex scan if no recognisable header row is found.

import type { TextItem } from './types'
import { groupIntoRows } from './textLines'

export interface ParsedSubjectRow {
  code: string
  name: string
  credits: number
  grade: string
}

export interface ParsedSemesterBlock {
  semesterLabel: string | null
  subjects: ParsedSubjectRow[]
  totalCredits: number | null
  sgpa: number | null
}

export interface GradeCardParseResult {
  studentName: string | null
  program: string | null
  semesters: ParsedSemesterBlock[]
}

const HEADER_LABELS = ['course code', 'course name', 'credits', 'grade', 'result']
const CODE_RE = /^[A-Z]{2,6}\d{3,6}$/ // e.g. DSQT7006, EMPL008

function rowText(row: TextItem[]): string {
  return row.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()
}

function findHeaderColumns(rows: TextItem[][]): Record<string, number> | null {
  for (const row of rows) {
    const text = rowText(row).toLowerCase()
    if (HEADER_LABELS.every(l => text.includes(l))) {
      const cols: Record<string, number> = {}
      for (const label of HEADER_LABELS) {
        // Header cells render as one combined token ("Course Code"), unlike
        // subject-row values which can be split word-by-word — so match the
        // full label, not just its first word.
        const match = row.find(i => i.str.trim().toLowerCase() === label)
        if (match) cols[label] = match.x
      }
      if (Object.keys(cols).length === HEADER_LABELS.length) return cols
    }
  }
  return null
}

// Fixed-column tables need a "which column has this x reached" (floor) test,
// not nearest-neighbour: a long course name's trailing words can sit closer
// (in raw distance) to the credits column's anchor than to the name column's,
// even though they clearly haven't crossed into it. Sorting column anchors
// ascending and taking the last one at-or-before x fixes that.
function columnForX(x: number, cols: Record<string, number>): string {
  const sorted = Object.entries(cols).sort((a, b) => a[1] - b[1])
  let best = sorted[0][0]
  for (const [label, cx] of sorted) {
    if (x >= cx - 3) best = label
    else break
  }
  return best
}

function extractLabelledValue(rows: TextItem[][], label: string): string | null {
  // Label cells render as one token including their colon (e.g. "Name :",
  // "Program:") with the value as the very next item on that row — several
  // labelled fields can share a line (Program | Academic Session), so a
  // whole-row regex would bleed across them. Match the label token directly
  // and take only its immediate neighbour.
  const labelRe = new RegExp(`^${label}\\s*:$`, 'i')
  for (const row of rows) {
    const idx = row.findIndex(i => labelRe.test(i.str.trim()))
    if (idx >= 0 && idx + 1 < row.length) {
      const value = row[idx + 1].str.trim()
      if (value) return value
    }
  }
  return null
}

export function parseGradeCardItems(pages: TextItem[][]): GradeCardParseResult {
  const allItems = pages.flat().filter(i => i.str.trim().length > 0)
  const rows = groupIntoRows(allItems)

  const studentName = extractLabelledValue(rows, 'Name')
  const program = extractLabelledValue(rows, 'Program')

  // Split rows into semester blocks: a "Semester N" label starts a block; the
  // next header row defines its columns; rows stop at the "Current Semester
  // Result" summary line (or the next "Semester N" label).
  const semesters: ParsedSemesterBlock[] = []
  let i = 0
  while (i < rows.length) {
    const text = rowText(rows[i])
    const semMatch = text.match(/^semester\s+(\d+)\b/i)
    if (!semMatch) { i++; continue }

    const semesterLabel = text
    let j = i + 1
    // find header row within this block
    let cols: Record<string, number> | null = null
    let headerIdx = -1
    for (; j < rows.length; j++) {
      const t = rowText(rows[j]).toLowerCase()
      if (/^semester\s+\d+\b/i.test(rowText(rows[j]))) break
      if (HEADER_LABELS.every(l => t.includes(l))) {
        cols = findHeaderColumns([rows[j]])
        headerIdx = j
        break
      }
    }

    const subjects: ParsedSubjectRow[] = []
    let totalCredits: number | null = null
    let sgpa: number | null = null

    if (cols && headerIdx >= 0) {
      for (j = headerIdx + 1; j < rows.length; j++) {
        const row = rows[j]
        const text2 = rowText(row)
        if (/^semester\s+\d+\b/i.test(text2)) break
        if (/current semester result/i.test(text2)) {
          const tcMatch = text2.match(/total credits\s*:?\s*(\d+)/i)
          if (tcMatch) totalCredits = parseInt(tcMatch[1], 10)
          continue
        }
        const sgpaMatch = text2.match(/sgpa\s*:?\s*(\d+(?:\.\d+)?)\s*\/\s*10/i)
        if (sgpaMatch) { sgpa = parseFloat(sgpaMatch[1]); continue }
        if (/^(candidate in consultation|needs to reappear|\*\*appeared|rpm\/rpf|sgpa\s*:semester|cgpa\s*:cumulative|nc\s*:not|medium of instruction)/i.test(text2)) {
          break // fine-print footer reached; stop scanning this block
        }

        const byCol: Record<string, TextItem[]> = {}
        for (const item of row) {
          const col = columnForX(item.x, cols)
          ;(byCol[col] ??= []).push(item)
        }
        const code = (byCol['course code'] ?? []).map(i => i.str).join('').trim()
        const name = (byCol['course name'] ?? []).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()
        const creditsStr = (byCol['credits'] ?? []).map(i => i.str).join('').trim()
        const grade = (byCol['grade'] ?? []).map(i => i.str).join('').trim()

        if (CODE_RE.test(code) && name && /^\d+(\.\d+)?$/.test(creditsStr) && grade) {
          subjects.push({ code, name, credits: parseFloat(creditsStr), grade })
        }
      }
    }

    if (subjects.length > 0 || totalCredits !== null || sgpa !== null) {
      semesters.push({ semesterLabel, subjects, totalCredits, sgpa })
    }
    i = j > i ? j : i + 1
  }

  return { studentName, program, semesters }
}
