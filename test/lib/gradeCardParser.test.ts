import { describe, expect, it } from 'vitest'
import { parseGradeCardItems } from '@/lib/parsers/gradeCardParser'
import type { TextItem } from '@/lib/parsers/types'

// Synthetic fixture mirroring the real column layout of a university grade
// card PDF: labelled fields sharing a line ("Program:" / "Academic Session:"),
// a header row of single-token column labels, subject rows with word-split
// course names, and a summary line with Total Credits + SGPA.
function fixturePage(): TextItem[] {
  return [
    { x: 18.4, y: 694.1, width: 0, str: 'Enrollment No:' },
    { x: 112.6, y: 694.9, width: 0, str: '10000001' },
    { x: 348.2, y: 694.1, width: 0, str: 'Name :' },
    { x: 442.4, y: 694.9, width: 0, str: 'Test Student' },

    { x: 18.4, y: 681.6, width: 0, str: 'Program:' },
    { x: 112.6, y: 682.4, width: 0, str: 'MBA (Test Program)' },
    { x: 348.2, y: 681.6, width: 0, str: 'Academic Session :' },
    { x: 442.4, y: 682.4, width: 0, str: '2025-2027' },

    { x: 14.7, y: 669.9, width: 0, str: 'Semester 1' },

    { x: 18.4, y: 656.6, width: 0, str: 'Course Code' },
    { x: 112.6, y: 656.6, width: 0, str: 'Course Name' },
    { x: 395.3, y: 656.6, width: 0, str: 'Credits' },
    { x: 442.4, y: 656.6, width: 0, str: 'Grade' },
    { x: 489.5, y: 656.6, width: 0, str: 'Result' },

    // Short single-token name.
    { x: 18.4, y: 644.2, width: 0, str: 'TEST1001' },
    { x: 112.6, y: 644.2, width: 0, str: 'Intro to Testing' },
    { x: 395.3, y: 644.2, width: 0, str: '3' },
    { x: 442.4, y: 644.2, width: 0, str: 'A+' },

    // Long, word-split name whose trailing words sit numerically closer to
    // the credits column's x than the name column's — this is the exact bug
    // a naive nearest-column classifier gets wrong.
    { x: 18.4, y: 633.9, width: 0, str: 'TEST1002' },
    { x: 112.6, y: 633.9, width: 0, str: 'Advanced' },
    { x: 192.0, y: 633.9, width: 0, str: 'Software' },
    { x: 253.8, y: 633.9, width: 0, str: 'Testing' },
    { x: 284.7, y: 633.9, width: 0, str: 'with' },
    { x: 306.7, y: 633.9, width: 0, str: 'Practice' },
    { x: 395.3, y: 633.9, width: 0, str: '2' },
    { x: 442.4, y: 633.9, width: 0, str: 'A' },

    { x: 170.0, y: 519.9, width: 0, str: 'Current Semester Result : SGPA/CGPA Qualifying Criteria Met' },
    { x: 402.2, y: 519.9, width: 0, str: 'Total Credits : 5' },
    { x: 402.2, y: 510.3, width: 0, str: 'SGPA :8.0/10' },
  ]
}

describe('parseGradeCardItems', () => {
  it('extracts student name and program from labelled fields sharing a line', () => {
    const result = parseGradeCardItems([fixturePage()])
    expect(result.studentName).toBe('Test Student')
    expect(result.program).toBe('MBA (Test Program)')
  })

  // Regression: nearest-column classification misclassified a long course
  // name's trailing words into the credits column because their x was
  // numerically closer to the credits anchor than to the name anchor, even
  // though they hadn't crossed into it. Must use a floor/boundary test.
  it('keeps a long word-split course name intact instead of bleeding into the credits column', () => {
    const result = parseGradeCardItems([fixturePage()])
    const subjects = result.semesters[0].subjects
    expect(subjects.map(s => s.name)).toEqual([
      'Intro to Testing',
      'Advanced Software Testing with Practice',
    ])
    expect(subjects.map(s => s.credits)).toEqual([3, 2])
    expect(subjects.map(s => s.grade)).toEqual(['A+', 'A'])
  })

  it('extracts total credits and SGPA for the semester', () => {
    const result = parseGradeCardItems([fixturePage()])
    const sem = result.semesters[0]
    expect(sem.semesterLabel).toBe('Semester 1')
    expect(sem.totalCredits).toBe(5)
    expect(sem.sgpa).toBe(8.0)
  })

  it('returns no semesters when no recognisable header row is present', () => {
    const result = parseGradeCardItems([[{ x: 0, y: 0, width: 0, str: 'not a grade card' }]])
    expect(result.semesters).toEqual([])
  })
})
