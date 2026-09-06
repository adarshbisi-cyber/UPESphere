import { describe, expect, it } from 'vitest'
import { looksLikeTimetableMissingClassNames, parseTimetableItems } from '@/lib/parsers/timetableParser'
import type { ColumnRun, TextItem, TimetableRenderSampler } from '@/lib/parsers/types'

function stubSampler(overrides: Partial<TimetableRenderSampler>): TimetableRenderSampler {
  return {
    sampleColumnRuns: async () => [],
    detectGridlineYs: async () => [],
    ...overrides,
  }
}

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
  it('does not let the hour-axis / ALL DAY margin swallow the first day column', async () => {
    const slots = await parseTimetableItems([fixturePage()])
    const mondaySlots = slots.filter(s => s.day === 'Monday')
    expect(mondaySlots).toHaveLength(2)
  })

  it('extracts time, subject and room for each slot, grouped by day', async () => {
    const slots = await parseTimetableItems([fixturePage()])

    expect(slots).toEqual([
      { day: 'Monday', date: '20/04', startTime: '09:30', endTime: '10:55', subject: 'Test Subject A', room: 'R101' },
      { day: 'Monday', date: '20/04', startTime: '12:00', endTime: '12:55', subject: 'Test Subject B', room: 'R102' },
      { day: 'Tuesday', date: '21/04', startTime: '08:00', endTime: '08:55', subject: 'Test Subject C', room: 'R201' },
    ])
  })

  it('returns no slots when no day-header row is present', async () => {
    const slots = await parseTimetableItems([[{ x: 0, y: 0, width: 0, str: 'not a timetable' }]])
    expect(slots).toEqual([])
  })
})

// Some calendar-app exports never print "HH:MM - HH:MM" at all — a class
// cell is just (subject, room) sitting inside a coloured box, and the box's
// height is the only record of its duration. This fixture mirrors that
// shape: same day-header row and hour-axis margin, but slot cells hold only
// two text runs, never a time range.
function noTimeTextFixturePage(): TextItem[] {
  return [
    { x: 105.3, y: 957.0, width: 0, str: 'MON, 31/08' },

    { x: 9.0, y: 858.0, width: 0, str: '08:00' },
    { x: 9.0, y: 760.0, width: 0, str: '09:00' },
    { x: 9.0, y: 662.0, width: 0, str: '10:00' },

    // No time-range line — just subject then room, like the header comment describes.
    { x: 60.9, y: 866.0, width: 0, str: 'Project Management' },
    { x: 60.9, y: 835.0, width: 0, str: 'K1409' },
    { x: 60.9, y: 719.0, width: 0, str: 'Global Context of Business' },
    { x: 60.9, y: 688.0, width: 0, str: 'K1309' },
  ]
}

describe('parseTimetableItems — coloured-box fallback (no time-range text)', () => {
  it('does nothing when no sampler is supplied (same as before this fallback existed)', async () => {
    const slots = await parseTimetableItems([noTimeTextFixturePage()])
    expect(slots).toEqual([])
  })

  it('does nothing when the sampler finds no boxes for a column', async () => {
    const slots = await parseTimetableItems([noTimeTextFixturePage()], {
      sampler: stubSampler({
        // Gridlines present (so calibration itself succeeds) but no boxes.
        detectGridlineYs: async () => [883.8, 785.8, 687.8],
      }),
    })
    expect(slots).toEqual([])
  })

  it('does nothing when the detected gridlines cannot calibrate the axis (no wrong guesses)', async () => {
    // Gridlines that don't line up with the axis labels at any plausible
    // shift — e.g. a page render that failed, or a template this heuristic
    // doesn't understand. Must not silently emit times built on a guess.
    const slots = await parseTimetableItems([noTimeTextFixturePage()], {
      sampler: stubSampler({
        detectGridlineYs: async () => [1, 2, 3],
        sampleColumnRuns: async () => [{ topY: 883.0, bottomY: 744.5 }],
      }),
    })
    expect(slots).toEqual([])
  })

  it('reads start/end times off the reported box extents and groups text by box', async () => {
    // Gridlines reported in raw PDF point space, as a real render would —
    // offset from the axis labels' own y (858/760/662), which is the whole
    // point: the parser must work out that offset itself (see next test).
    const runs: ColumnRun[] = [
      { topY: 883.0, bottomY: 744.5 }, // -> 08:00-09:25
      { topY: 736.0, bottomY: 597.5 }, // -> 09:30-10:55
    ]
    const slots = await parseTimetableItems([noTimeTextFixturePage()], {
      sampler: stubSampler({
        detectGridlineYs: async () => [883.8, 785.8, 687.8],
        sampleColumnRuns: async () => runs,
      }),
    })

    expect(slots).toEqual([
      { day: 'Monday', date: '31/08', startTime: '08:00', endTime: '09:25', subject: 'Project Management', room: 'K1409' },
      { day: 'Monday', date: '31/08', startTime: '09:30', endTime: '10:55', subject: 'Global Context of Business', room: 'K1309' },
    ])
  })

  it('leaves the explicit "HH:MM - HH:MM" path untouched when that text is present', async () => {
    // Even with a sampler wired up, a column that already has time-range
    // text should never hit the fallback (and never call the sampler).
    let called = false
    const slots = await parseTimetableItems([fixturePage()], {
      sampler: stubSampler({ sampleColumnRuns: async () => { called = true; return [] } }),
    })
    expect(called).toBe(false)
    expect(slots).toHaveLength(3)
  })

  // The offset between an hour-axis label and the ruling line it names isn't
  // fixed — different export tools draw it differently. This must be worked
  // out per PDF from that PDF's own rendered gridlines, not assumed. Same
  // axis labels, two different (synthetic) export tools' box/gridline
  // geometry, same real class time recovered both times.
  describe('derives the label-to-gridline offset per PDF instead of assuming one', () => {
    function axisOnlyFixturePage(): TextItem[] {
      return [
        { x: 105.3, y: 957.0, width: 0, str: 'MON, 01/01' },
        { x: 9.0, y: 800.0, width: 0, str: '08:00' },
        { x: 9.0, y: 700.0, width: 0, str: '09:00' },
        { x: 9.0, y: 600.0, width: 0, str: '10:00' },
        { x: 60.9, y: 790.0, width: 0, str: 'Some Class' },
        { x: 60.9, y: 760.0, width: 0, str: 'Room 1' },
      ]
    }

    it('export tool A: gridlines sit 10pt above the label', async () => {
      const slots = await parseTimetableItems([axisOnlyFixturePage()], {
        sampler: stubSampler({
          detectGridlineYs: async () => [790, 690, 590],
          sampleColumnRuns: async () => [{ topY: 790, bottomY: 690 }],
        }),
      })
      expect(slots).toEqual([
        { day: 'Monday', date: '01/01', startTime: '08:00', endTime: '09:00', subject: 'Some Class', room: 'Room 1' },
      ])
    })

    it('export tool B: gridlines sit 15pt below the label — same real time recovered', async () => {
      const slots = await parseTimetableItems([axisOnlyFixturePage()], {
        sampler: stubSampler({
          detectGridlineYs: async () => [815, 715, 615],
          sampleColumnRuns: async () => [{ topY: 815, bottomY: 715 }],
        }),
      })
      expect(slots).toEqual([
        { day: 'Monday', date: '01/01', startTime: '08:00', endTime: '09:00', subject: 'Some Class', room: 'Room 1' },
      ])
    })
  })
})

// Some exports (an agenda/list view rather than a weekly grid) print day
// names, dates and "HH:MM-HH:MM" ranges but never write a class name or room
// into the file at all — verified against a real such export (a "Kendo UI
// PDF Generator" agenda view): no image, no annotation, nothing to recover.
// No layout heuristic can produce data that was never in the document, so
// the parser instead recognises the shape and lets the UI say why.
function agendaListNoTitlesFixturePage(): TextItem[] {
  return [
    { x: 90, y: 1556, width: 0, str: 'DATE' },
    { x: 292, y: 1556, width: 0, str: 'TIME' },
    { x: 10, y: 1485, width: 0, str: '07' },
    { x: 65, y: 1505, width: 0, str: 'Monday' },
    { x: 65, y: 1484, width: 0, str: 'Sept 2026' },
    { x: 219, y: 1504, width: 0, str: '09:00-11:55' },
    { x: 219, y: 1351, width: 0, str: '12:00-12:55' },
    { x: 10, y: 1179, width: 0, str: '08' },
    { x: 65, y: 1199, width: 0, str: 'Tuesday' },
    { x: 65, y: 1178, width: 0, str: 'Sept 2026' },
    { x: 219, y: 1198, width: 0, str: '08:00-08:55' },
  ]
}

describe('looksLikeTimetableMissingClassNames', () => {
  it('recognises a day/date/time export that never included class names or rooms', () => {
    expect(looksLikeTimetableMissingClassNames([agendaListNoTitlesFixturePage()])).toBe(true)
  })

  it('is false for a normal timetable — subject/room text makes it not "missing"', () => {
    expect(looksLikeTimetableMissingClassNames([fixturePage()])).toBe(false)
    expect(looksLikeTimetableMissingClassNames([noTimeTextFixturePage()])).toBe(false)
  })

  it('is false for a file with no timetable-shaped content at all', () => {
    expect(looksLikeTimetableMissingClassNames([[{ x: 0, y: 0, width: 0, str: 'just some unrelated PDF text' }]])).toBe(false)
  })

  it('is false when there are day names but no time ranges (not this failure mode)', () => {
    const page: TextItem[] = [{ x: 65, y: 1505, width: 0, str: 'Monday' }]
    expect(looksLikeTimetableMissingClassNames([page])).toBe(false)
  })
})

// Shape 3: a single-column agenda/list export (no day-column grid — day is
// decided by which heading's vertical band a slot falls in). Mirrors a real
// export verified end-to-end: subject line, a "Room :" label split across
// two text runs at the same y, then instructor and course-code lines that
// must be ignored rather than corrupting the subject/room.
function agendaListWithEventsFixturePages(): TextItem[][] {
  return [[
    { x: 90, y: 1265, width: 0, str: 'DATE' },
    { x: 292, y: 1265, width: 0, str: 'TIME' },
    { x: 847, y: 1265, width: 0, str: 'EVENT' },

    { x: 65, y: 1215, width: 0, str: 'Monday' },
    { x: 65, y: 1194, width: 0, str: 'Sept 2026' },
    { x: 10, y: 1195, width: 0, str: '07' },

    { x: 219, y: 1214, width: 0, str: '08:00-09:25' },
    { x: 427, y: 1186, width: 0, str: 'Project Management' },
    { x: 427, y: 1166, width: 0, str: 'Room :' },
    { x: 466, y: 1166, width: 0, str: 'K1409' },
    { x: 465, y: 1141, width: 0, str: 'ANIL GURJAR (40004649)' },
    { x: 841, y: 1141, width: 0, str: 'MBA-SC-KPMG-III-B1_Project Management(MBA-SC-KPMG-III-B1_LSCM8043_3)' },

    { x: 219, y: 1090, width: 0, str: '09:30-10:55' },
    { x: 427, y: 1062, width: 0, str: 'Global Context of Business' },
    { x: 427, y: 1042, width: 0, str: 'Room :' },
    { x: 466, y: 1042, width: 0, str: 'K1309' },
    { x: 465, y: 1017, width: 0, str: 'AKSHI BAJAJ (40004538)' },

    { x: 65, y: 719, width: 0, str: 'Tuesday' },
    { x: 65, y: 698, width: 0, str: 'Sept 2026' },
    { x: 10, y: 699, width: 0, str: '08' },

    { x: 219, y: 718, width: 0, str: '08:00-09:25' },
    { x: 427, y: 690, width: 0, str: 'Strategic Management II' },
    { x: 427, y: 670, width: 0, str: 'Room :' },
    { x: 466, y: 670, width: 0, str: 'K1409' },
    { x: 465, y: 645, width: 0, str: 'Rajesh Tripathi (40000982)' },
  ]]
}

describe('parseTimetableItems — single-column agenda/list (shape 3)', () => {
  it('extracts day (by vertical section, not x), date, time, subject and room', async () => {
    const slots = await parseTimetableItems(agendaListWithEventsFixturePages())

    expect(slots).toEqual([
      { day: 'Monday', date: '07/09', startTime: '08:00', endTime: '09:25', subject: 'Project Management', room: 'K1409' },
      { day: 'Monday', date: '07/09', startTime: '09:30', endTime: '10:55', subject: 'Global Context of Business', room: 'K1309' },
      { day: 'Tuesday', date: '08/09', startTime: '08:00', endTime: '09:25', subject: 'Strategic Management II', room: 'K1409' },
    ])
  })

  it('falls back to a bare second line as the room when there is no "Room" label', async () => {
    const page: TextItem[] = [
      { x: 65, y: 1215, width: 0, str: 'Monday' },
      { x: 10, y: 1195, width: 0, str: '07' },
      { x: 65, y: 1194, width: 0, str: 'Sept 2026' },
      { x: 219, y: 1214, width: 0, str: '08:00-09:25' },
      { x: 427, y: 1186, width: 0, str: 'Project Management' },
      { x: 427, y: 1166, width: 0, str: 'K1409' },
    ]
    const slots = await parseTimetableItems([page])
    expect(slots).toEqual([
      { day: 'Monday', date: '07/09', startTime: '08:00', endTime: '09:25', subject: 'Project Management', room: 'K1409' },
    ])
  })

  it('returns no slots for a day heading with no time ranges under it', async () => {
    const page: TextItem[] = [
      { x: 65, y: 1215, width: 0, str: 'Monday' },
      { x: 10, y: 1195, width: 0, str: '07' },
      { x: 65, y: 1194, width: 0, str: 'Sept 2026' },
    ]
    expect(await parseTimetableItems([page])).toEqual([])
  })

  it('does not confuse this with a day-column grid — grid headers still take that path', async () => {
    // Sanity check: a real shape-1 fixture never reaches parseAgendaListItems.
    const slots = await parseTimetableItems([fixturePage()])
    expect(slots).toHaveLength(3)
  })
})
