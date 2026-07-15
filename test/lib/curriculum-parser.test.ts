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
})
