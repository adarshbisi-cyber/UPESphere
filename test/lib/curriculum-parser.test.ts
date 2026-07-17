import { describe, expect, it } from 'vitest'
import { parseSubjectsFromOCR } from '@/lib/curriculum-parser'

describe('parseSubjectsFromOCR', () => {
  // Regression: a curriculum table where the last course name wraps to two
  // lines. Tesseract strands the code + credits on their own middle line
  // ("STGM8002_3 3 0"), so the earlier parser dropped the whole subject.
  it('detects a subject whose course name wraps across two lines', () => {
    const ocr = [
      'INTB8020_1 Global Context of Business 1 0',
      'LSCM8043_3 Project Management 3 0',
      'STGM8018_3 Strategic Management II 3 0',
      'Merger, Acquisition and Corporate',
      'STGM8002_3 3 0',
      'Restructuring',
    ].join('\n')

    const subjects = parseSubjectsFromOCR(ocr, new Set())

    expect(subjects).toHaveLength(4)
    expect(subjects.map(s => s.name)).toEqual([
      'Global Context of Business',
      'Project Management',
      'Strategic Management II',
      'Merger, Acquisition and Corporate Restructuring',
    ])
    expect(subjects.map(s => s.credits)).toEqual([1, 3, 3, 3])
  })

  // The credit column is followed by an "Available Seats" column, so each row
  // ends with two numbers. The credit must be the FIRST number, not the last.
  it('reads the credit column, not the trailing available-seats column', () => {
    const ocr = 'CS101 Data Structures 4 0'
    const [subject] = parseSubjectsFromOCR(ocr, new Set())

    expect(subject.name).toBe('Data Structures')
    expect(subject.credits).toBe(4)
  })

  it('skips header rows and does not duplicate subjects across a shared seen set', () => {
    const seen = new Set<string>()
    const ocr = [
      'Code Course Credits Available Seats',
      'CS101 Data Structures 4 0',
    ].join('\n')

    const first = parseSubjectsFromOCR(ocr, seen)
    expect(first).toHaveLength(1)

    // Same subject in a second screenshot should be de-duped via the seen set.
    const second = parseSubjectsFromOCR(ocr, seen)
    expect(second).toHaveLength(0)
  })

  // Regression: tesseract commonly misreads a code's leading letter case
  // ("SIIB8101_2" -> "SlIB8101_2"), which made the old case-sensitive code
  // matcher fail to recognise it as a code at all, leaving it glued to the
  // course name.
  it('recognises a course code even when OCR misreads its letter case', () => {
    const ocr = 'SlIB8101_2 Summer Internship 2 0'
    const [subject] = parseSubjectsFromOCR(ocr, new Set())

    expect(subject.name).toBe('Summer Internship')
    expect(subject.credits).toBe(2)
  })

  // Regression: a course title that itself ends in a bare number ("Boot Camp
  // 2") was misread as the credit column. The code's own "_N" suffix is the
  // authoritative credit value and must win over the row-text heuristic.
  it('keeps a trailing number that is part of the course title, using the code for credits', () => {
    const ocr = 'JRBC7002_1 Job Ready Boot Camp 2 1 0'
    const [subject] = parseSubjectsFromOCR(ocr, new Set())

    expect(subject.name).toBe('Job Ready Boot Camp 2')
    expect(subject.credits).toBe(1)
  })

  // Regression: "Internship" was in the trailing-course-type strip list
  // (meant for suffixes like "... Open Elective"), so a title that genuinely
  // ends with "Internship" got truncated to nonsense.
  it('does not truncate a course title that ends with "Internship"', () => {
    const ocr = 'SIIB8101_2 Summer Internship 2 0'
    const [subject] = parseSubjectsFromOCR(ocr, new Set())

    expect(subject.name).toBe('Summer Internship')
  })

  // Regression: a course code with a variant letter before the credit suffix
  // (e.g. a "Practical" section) wasn't recognised as a code at all.
  it('recognises a course code with a variant letter before the credit suffix', () => {
    const ocr = [
      'Business Model Innovation &',
      'STGM8025P_3 3 0',
      'Entrepreneurial Strategy',
    ].join('\n')
    const [subject] = parseSubjectsFromOCR(ocr, new Set())

    expect(subject.name).toBe('Business Model Innovation & Entrepreneurial Strategy')
    expect(subject.credits).toBe(3)
  })

  // Regression: when a wrapped title's stranded code line is immediately
  // followed by ANOTHER wrapped title's opening fragment, an uncapped
  // fragment scan ran straight through the boundary and merged two separate
  // subjects into one garbled entry. Real wraps in this table are at most
  // one line each way, so the scan must stop there.
  it('does not merge two different subjects across a fragment boundary', () => {
    const ocr = [
      'STGM8018_3 Strategic Management II 3 0',
      'Merger, Acquisition and',
      'STGM8002_3 3 0',
      'Corporate Restructuring',
      'Business and Financial',
      'FINC8057_2 2 0',
      'Modeling',
    ].join('\n')

    const subjects = parseSubjectsFromOCR(ocr, new Set())

    expect(subjects.map(s => s.name)).toEqual([
      'Strategic Management II',
      'Merger, Acquisition and Corporate Restructuring',
      'Business and Financial Modeling',
    ])
    expect(subjects.map(s => s.credits)).toEqual([3, 3, 2])
  })

  // Regression: a wrapped title split by a hyphenated word break ("Firms-" /
  // "based") must rejoin as one compound word, not "Firmsbased" (hyphen and
  // space both lost) or "Firms- based" (stray space after the hyphen).
  it('rejoins a hyphenated word split across the line wrap', () => {
    const ocr = [
      'Business Strategy by Firms-',
      'STGM8026_3 based in Emerging Market 3 0',
      'Economies',
    ].join('\n')
    const [subject] = parseSubjectsFromOCR(ocr, new Set())

    expect(subject.name).toBe('Business Strategy by Firms-based in Emerging Market Economies')
    expect(subject.credits).toBe(3)
  })
})
