import { describe, expect, it } from 'vitest'
import { currentCalendarMonth, CALENDAR_MIN, CALENDAR_MAX } from '@/lib/data/academicCalendar'

describe('currentCalendarMonth', () => {
  // Regression: the calendar used to always open on a hardcoded July 2026
  // default, regardless of the actual date.
  it('opens on the visitor\'s actual current month, not a fixed default', () => {
    expect(currentCalendarMonth(new Date(2026, 8, 6))).toEqual({ year: 2026, month: 8 }) // 6 Sept 2026 -> September
    expect(currentCalendarMonth(new Date(2026, 9, 1))).toEqual({ year: 2026, month: 9 }) // October
  })

  it('handles the year boundary correctly', () => {
    expect(currentCalendarMonth(new Date(2026, 11, 31))).toEqual({ year: 2026, month: 11 }) // December 2026
    expect(currentCalendarMonth(new Date(2027, 0, 1))).toEqual({ year: 2027, month: 0 }) // January 2027
  })

  it('clamps to the calendar\'s minimum month when today is before the dataset starts', () => {
    expect(currentCalendarMonth(new Date(2026, 0, 15))).toEqual({ year: CALENDAR_MIN.year, month: CALENDAR_MIN.month })
  })

  it('clamps to the calendar\'s maximum month when today is after the dataset ends', () => {
    expect(currentCalendarMonth(new Date(2028, 5, 1))).toEqual({ year: CALENDAR_MAX.year, month: CALENDAR_MAX.month })
  })

  it('is exactly the boundary month when today falls exactly on it', () => {
    expect(currentCalendarMonth(new Date(CALENDAR_MIN.year, CALENDAR_MIN.month, 1))).toEqual(CALENDAR_MIN)
    expect(currentCalendarMonth(new Date(CALENDAR_MAX.year, CALENDAR_MAX.month, 1))).toEqual(CALENDAR_MAX)
  })
})
