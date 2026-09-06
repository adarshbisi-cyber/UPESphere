import { describe, expect, it } from 'vitest'
import {
  countDigitsBeforeIndex, formatIndianNumber, indexAfterDigitCount, sanitizeDigits,
} from '@/lib/format/currency'

describe('formatIndianNumber', () => {
  it('groups by the Indian lakh/crore convention, not international thousands', () => {
    expect(formatIndianNumber('1000')).toBe('1,000')
    expect(formatIndianNumber('10000')).toBe('10,000')
    expect(formatIndianNumber('100000')).toBe('1,00,000')
    expect(formatIndianNumber('1000000')).toBe('10,00,000')
    expect(formatIndianNumber('12000000')).toBe('1,20,00,000')
    expect(formatIndianNumber('120000000')).toBe('12,00,00,000')
  })

  it('returns empty string for empty input rather than "0" or "NaN"', () => {
    expect(formatIndianNumber('')).toBe('')
  })
})

describe('sanitizeDigits', () => {
  it('strips non-digit characters, including a pasted ₹ or commas', () => {
    expect(sanitizeDigits('₹12,00,000')).toBe('1200000')
    expect(sanitizeDigits('12,00,000')).toBe('1200000')
    expect(sanitizeDigits('abc123def')).toBe('123')
  })

  it('strips leading zeros but keeps a lone "0" while the user is still typing', () => {
    expect(sanitizeDigits('007')).toBe('7')
    expect(sanitizeDigits('0')).toBe('0')
    expect(sanitizeDigits('')).toBe('')
  })
})

describe('digit-index round trip (the cursor-stability math)', () => {
  it('finds the same digit position after commas shift around it', () => {
    // "1200000" -> "12,00,000": the digit '2' (2nd digit) sits right after
    // one comma has appeared before it.
    const formatted = '12,00,000'
    const digitsBefore = countDigitsBeforeIndex(formatted, 2) // "12" — cursor after both digits
    expect(digitsBefore).toBe(2)
    expect(indexAfterDigitCount(formatted, 2)).toBe(2) // still right after "12", before the comma
  })

  it('lands after a newly-inserted comma when digit count crosses a grouping boundary', () => {
    // Typing another digit turns "1,000" into "10,000" — 2 digits typed
    // should land after "10", which is now followed by a comma.
    const formatted = '10,000'
    expect(indexAfterDigitCount(formatted, 2)).toBe(2)
  })

  it('is the identity for a string with no separators', () => {
    const formatted = '999'
    for (let i = 0; i <= 3; i++) {
      expect(indexAfterDigitCount(formatted, countDigitsBeforeIndex(formatted, i))).toBeLessThanOrEqual(3)
    }
  })

  it('handles an index at or past the end of the string', () => {
    expect(countDigitsBeforeIndex('12,000', 100)).toBe(5)
    expect(indexAfterDigitCount('12,000', 0)).toBe(0)
    expect(indexAfterDigitCount('12,000', 999)).toBe('12,000'.length)
  })
})
