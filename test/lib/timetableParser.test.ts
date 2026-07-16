import { describe, expect, it } from 'vitest'
import { parseTimetableItems } from '@/lib/parsers/timetableParser'
import type { TextItem } from '@/lib/parsers/types'

// Synthetic fixture mirroring a weekly scheduler PDF: day-column headers,
// an hour-of-day axis down the left margin, an "ALL DAY" section label (both
// of which sit in the same narrow left margin and must not be mistaken for a
// day column), and per-slot (time-range, subject, room) triples stacked at a
// consistent x per day.
function fixturePage(): TextItem[] {
  return [
    { x: 105.3, y: 957.0, width: 0, str: 'MON, 20/04' },
    { x: 289.9, y: 957.0, width: 0, str: 'TUE, 21/04' },

    { x: 9.0, y: 912.5, width: 0, str: 'ALL DAY' },
    { x: 9.0, y: 858.0, width: 0, str: '08:00' },
    { x: 9.0, y: 760.0, width: 0, str: '09:00' },

    // Monday column (item x sits left of its header by a fixed offset).
    { x: 60.9, y: 719.0, width: 0, str: '09:30 - 10:55' },
    { x: 60.9, y: 695.0, width: 0, str: 'Test Subject A' },
    { x: 60.9, y: 663.5, width: 0, str: 'R101' },

    { x: 60.9, y: 474.0, width: 0, str: '12:00 - 12:55' },
    { x: 60.9, y: 450.0, width: 0, str: 'Test Subject B' },
    { x: 60.9, y: 418.5, width: 0, str: 'R102' },

    // Tuesday column.
    { x: 242.9, y: 866.0, width: 0, str: '08:00 - 08:55' },
    { x: 242.9, y: 842.0, width: 0, str: 'Test Subject C' },
    { x: 242.9, y: 810.5, width: 0, str: 'R201' },
  ]
}

describe('parseTimetableItems', () => {
  // Regression: the hour-axis labels ("08:00") and the "ALL DAY" section
  // label both sit in the same left-margin x cluster (~9pt), which is close
  // enough to Monday's item column (~61pt, gap ~52pt) to merge into one
  // cluster and hijack Monday's anchor — silently dropping the whole day.
  it('does not let the hour-axis / ALL DAY margin swallow the first day column', () => {
    const slots = parseTimetableItems([fixturePage()])
    const mondaySlots = slots.filter(s => s.day === 'Monday')
    expect(mondaySlots).toHaveLength(2)
  })

  it('extracts time, subject and room for each slot, grouped by day', () => {
    const slots = parseTimetableItems([fixturePage()])

    expect(slots).toEqual([
      { day: 'Monday', date: '20/04', startTime: '09:30', endTime: '10:55', subject: 'Test Subject A', room: 'R101' },
      { day: 'Monday', date: '20/04', startTime: '12:00', endTime: '12:55', subject: 'Test Subject B', room: 'R102' },
      { day: 'Tuesday', date: '21/04', startTime: '08:00', endTime: '08:55', subject: 'Test Subject C', room: 'R201' },
    ])
  })

  it('returns no slots when no day-header row is present', () => {
    const slots = parseTimetableItems([[{ x: 0, y: 0, width: 0, str: 'not a timetable' }]])
    expect(slots).toEqual([])
  })
})
