import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_PERIODS, DEFAULT_ACTIVITY_PERIOD, buildActivityGrid, computeActivityInsight,
  buildMonthRows, computeActivitySummary, computeHeatmapLayout, countByDay, groupByDay,
  heatmapModeFor, intensityLevel, parseIsoDay, resolvePeriodRange, toIsoDay, DAYS_IN_LONGEST_MONTH,
} from '@/lib/placementTracker/activity'
import type { PlacementApplication } from '@/lib/placementTracker/types'

let seq = 0
function application(applicationDate: string, overrides: Partial<PlacementApplication> = {}): PlacementApplication {
  seq++
  return {
    id: `a${seq}`, userId: 'u1', companyName: `Company ${seq}`, role: 'Analyst', opportunityType: 'placement',
    industry: null, location: null, package: null, stipend: null, applicationDate,
    status: 'active', notes: null, rounds: [],
    // Deliberately far from applicationDate: nothing here may key off these.
    createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('local date handling', () => {
  it("reads a 'YYYY-MM-DD' day as that calendar day regardless of timezone", () => {
    const d = parseIsoDay('2026-09-07')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(7)
    expect(toIsoDay(d)).toBe('2026-09-07')
  })
})

describe('countByDay', () => {
  it('groups by applicationDate and stacks multiple applications on one day', () => {
    const counts = countByDay([application('2026-09-07'), application('2026-09-07'), application('2026-09-08')])
    expect(counts.get('2026-09-07')).toBe(2)
    expect(counts.get('2026-09-08')).toBe(1)
  })

  it('uses applicationDate, never the record timestamps', () => {
    // Entered "today" (createdAt 2030) for an application actually made in March.
    const counts = countByDay([application('2026-03-02')])
    expect(counts.get('2026-03-02')).toBe(1)
    expect(counts.get('2030-01-01')).toBeUndefined()
  })

  it('returns nothing for no applications', () => {
    expect(countByDay([]).size).toBe(0)
  })
})

describe('intensityLevel', () => {
  it('maps counts onto the five documented levels, capping at 4+', () => {
    expect(intensityLevel(0)).toBe(0)
    expect(intensityLevel(1)).toBe(1)
    expect(intensityLevel(2)).toBe(2)
    expect(intensityLevel(3)).toBe(3)
    expect(intensityLevel(4)).toBe(4)
    expect(intensityLevel(97)).toBe(4)
  })
})

describe('resolvePeriodRange', () => {
  const now = new Date(2026, 8, 7) // 7 September 2026

  it('defaults to the last 12 months and spans the calendar-year boundary', () => {
    expect(DEFAULT_ACTIVITY_PERIOD).toBe('last_12_months')
    const { start, end } = resolvePeriodRange('last_12_months', [], now)
    expect(toIsoDay(start)).toBe('2025-10-01')
    expect(toIsoDay(end)).toBe('2026-09-30')
  })

  it('scopes "this month" to the current calendar month only', () => {
    const { start, end } = resolvePeriodRange('this_month', [], now)
    expect(toIsoDay(start)).toBe('2026-09-01')
    expect(toIsoDay(end)).toBe('2026-09-30')
  })

  it('covers the shorter windows', () => {
    expect(toIsoDay(resolvePeriodRange('last_3_months', [], now).start)).toBe('2026-07-01')
    expect(toIsoDay(resolvePeriodRange('last_6_months', [], now).start)).toBe('2026-04-01')
  })

  it('starts the placement season in July of the season containing today', () => {
    expect(toIsoDay(resolvePeriodRange('placement_season', [], now).start)).toBe('2026-07-01')
    // January still belongs to the season that began the previous July.
    expect(toIsoDay(resolvePeriodRange('placement_season', [], new Date(2027, 0, 15)).start)).toBe('2026-07-01')
  })

  it('stretches the window to include a future-dated application', () => {
    const { end } = resolvePeriodRange('this_month', [application('2026-11-20')], now)
    expect(toIsoDay(end)).toBe('2026-11-30')
  })

  it('offers every period the spec lists', () => {
    expect(ACTIVITY_PERIODS.map(p => p.label)).toEqual([
      'This Month', 'Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'Placement Season',
    ])
  })
})

describe('buildActivityGrid', () => {
  const now = new Date(2026, 8, 7)

  it('lays out whole weeks of 7 days and marks padding outside the range', () => {
    const range = resolvePeriodRange('this_month', [], now)
    const grid = buildActivityGrid(range, new Map())
    expect(grid.weeks.every(w => w.days.length === 7)).toBe(true)
    // 1 September 2026 is a Tuesday, so Sunday and Monday before it are padding.
    expect(grid.weeks[0].days[0].inRange).toBe(false)
    expect(grid.weeks[0].days[2].inRange).toBe(true)
  })

  it('counts only days inside the range', () => {
    const range = resolvePeriodRange('this_month', [], now)
    const grid = buildActivityGrid(range, groupByDay([application('2026-09-07'), application('2026-08-30')]))
    expect(grid.totalInRange).toBe(1)
  })

  it('labels each month once, in column order', () => {
    const range = resolvePeriodRange('last_3_months', [], now)
    const grid = buildActivityGrid(range, new Map())
    expect(grid.monthLabels.map(m => m.label)).toEqual(['Jul', 'Aug', 'Sep'])
    const columns = grid.monthLabels.map(m => m.columnIndex)
    expect([...columns].sort((a, b) => a - b)).toEqual(columns)
  })

  it('handles a range spanning multiple calendar years', () => {
    const grid = buildActivityGrid(resolvePeriodRange('last_12_months', [], now), new Map())
    expect(grid.monthLabels.map(m => m.label)).toEqual(
      ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    )
  })

  it('renders an empty but well-formed grid with no applications', () => {
    const grid = buildActivityGrid(resolvePeriodRange('last_12_months', [], now), new Map())
    expect(grid.totalInRange).toBe(0)
    expect(grid.weeks.length).toBeGreaterThan(0)
    expect(grid.weeks.every(w => w.days.every(d => d.level === 0))).toBe(true)
  })
})

describe('computeActivitySummary', () => {
  const now = new Date(2026, 8, 7) // September 2026

  it('counts this month and last month separately', () => {
    const apps = [application('2026-09-01'), application('2026-09-05'), application('2026-08-14')]
    const summary = computeActivitySummary(apps, resolvePeriodRange('last_12_months', apps, now), now)
    expect(summary.thisMonth).toBe(2)
    expect(summary.lastMonth).toBe(1)
  })

  it('crosses the year boundary when finding last month', () => {
    const january = new Date(2027, 0, 10)
    const apps = [application('2026-12-20'), application('2027-01-04')]
    const summary = computeActivitySummary(apps, resolvePeriodRange('last_12_months', apps, january), january)
    expect(summary.thisMonth).toBe(1)
    expect(summary.lastMonth).toBe(1)
  })

  it('picks the best month within the selected range only', () => {
    const apps = [
      application('2026-09-01'),
      application('2026-02-01'), application('2026-02-02'), application('2026-02-03'),
    ]
    const inRange = computeActivitySummary(apps, resolvePeriodRange('last_12_months', apps, now), now)
    expect(inRange.bestMonth).toEqual({ label: 'Feb 2026', count: 3 })

    const thisMonthOnly = computeActivitySummary(apps, resolvePeriodRange('this_month', apps, now), now)
    expect(thisMonthOnly.bestMonth).toEqual({ label: 'Sep 2026', count: 1 })
  })

  it('has no best month when the selected period contains nothing', () => {
    const apps = [application('2020-01-01')]
    const summary = computeActivitySummary(apps, resolvePeriodRange('this_month', apps, now), now)
    expect(summary.bestMonth).toBeNull()
  })

  it('counts distinct active weeks of the current month out of the weeks it spans', () => {
    // September 2026 starts Tuesday and has 30 days, spanning 5 calendar weeks.
    const apps = [application('2026-09-01'), application('2026-09-02'), application('2026-09-14')]
    const summary = computeActivitySummary(apps, resolvePeriodRange('this_month', apps, now), now)
    expect(summary.activeWeeks).toEqual({ active: 2, total: 5 })
  })

  it('reports zero active weeks for a current month with no applications', () => {
    const apps = [application('2026-07-01')]
    const summary = computeActivitySummary(apps, resolvePeriodRange('last_12_months', apps, now), now)
    expect(summary.activeWeeks.active).toBe(0)
    expect(summary.activeWeeks.total).toBeGreaterThan(0)
    expect(summary.thisMonth).toBe(0)
  })
})

describe('computeActivityInsight', () => {
  const now = new Date(2026, 8, 7)
  const summaryFor = (apps: PlacementApplication[], at: Date = now) =>
    computeActivitySummary(apps, resolvePeriodRange('last_12_months', apps, at), at)

  it('asks for more history with no applications at all', () => {
    expect(computeActivityInsight([], summaryFor([]), now)).toContain('Keep building your application history')
  })

  it('asks for more history with only one application', () => {
    const apps = [application('2026-09-05')]
    expect(computeActivityInsight(apps, summaryFor(apps), now)).toContain('Keep building your application history')
  })

  it('nudges the student when nothing has been submitted in the last 14 days', () => {
    const apps = [application('2026-06-01'), application('2026-06-02')]
    expect(computeActivityInsight(apps, summaryFor(apps), now)).toContain("haven't submitted a tracked application")
  })

  it('celebrates momentum when this month beats last month', () => {
    const apps = [application('2026-09-01'), application('2026-09-05'), application('2026-08-10')]
    expect(computeActivityInsight(apps, summaryFor(apps), now)).toContain('building momentum')
  })

  it('flags a slowdown when this month trails last month', () => {
    const apps = [application('2026-09-05'), application('2026-08-01'), application('2026-08-02')]
    expect(computeActivityInsight(apps, summaryFor(apps), now)).toContain('slowed down')
  })

  it('praises consistency when activity is level but spread across weeks', () => {
    const apps = [
      application('2026-09-01'), application('2026-09-07'),
      application('2026-08-03'), application('2026-08-04'),
    ]
    expect(computeActivityInsight(apps, summaryFor(apps), now)).toContain('Great consistency')
  })

  it('never claims a trend from a single day of activity', () => {
    const apps = [application('2026-09-07'), application('2026-08-07')]
    const insight = computeActivityInsight(apps, summaryFor(apps), now)
    expect(insight).not.toContain('momentum')
    expect(insight).not.toContain('slowed down')
  })
})

describe('groupByDay', () => {
  it('maps each day to the applications that landed on it', () => {
    const a = application('2026-09-07')
    const b = application('2026-09-07')
    const c = application('2026-09-08')
    const byDay = groupByDay([a, b, c])
    expect(byDay.get('2026-09-07')).toEqual([a.id, b.id])
    expect(byDay.get('2026-09-08')).toEqual([c.id])
  })

  it('keeps counts and ids in agreement', () => {
    const apps = [application('2026-09-07'), application('2026-09-07'), application('2026-09-08')]
    const byDay = groupByDay(apps)
    const counts = countByDay(apps)
    for (const [iso, ids] of Array.from(byDay.entries())) {
      expect(counts.get(iso)).toBe(ids.length)
    }
  })

  it('carries the ids onto the grid cells so a day can later be drilled into', () => {
    const now = new Date(2026, 8, 7)
    const a = application('2026-09-07')
    const b = application('2026-09-07')
    const grid = buildActivityGrid(resolvePeriodRange('this_month', [a, b], now), groupByDay([a, b]))
    const cell = grid.weeks.flatMap(w => w.days).find(d => d.iso === '2026-09-07')
    expect(cell?.applicationIds).toEqual([a.id, b.id])
    expect(cell?.count).toBe(2)
    // Padding days outside the range carry nothing.
    const padding = grid.weeks[0].days.find(d => !d.inRange)
    expect(padding?.applicationIds).toEqual([])
  })
})

describe('heatmapModeFor', () => {
  it('uses compact month rows for short ranges and the contribution grid for long ones', () => {
    expect(heatmapModeFor('this_month')).toBe('month_rows')
    expect(heatmapModeFor('last_3_months')).toBe('month_rows')
    for (const p of ['last_6_months', 'last_12_months', 'placement_season'] as const) {
      expect(heatmapModeFor(p)).toBe('contribution')
    }
  })
})

describe('buildMonthRows', () => {
  const now = new Date(2026, 8, 7) // September 2026

  it('emits one row per month, oldest first, running 1st to 31st', () => {
    const rows = buildMonthRows(resolvePeriodRange('last_3_months', [], now), new Map())
    expect(rows.map(r => r.label)).toEqual(['Jul', 'Aug', 'Sep'])
    expect(rows.every(r => r.days.length === DAYS_IN_LONGEST_MONTH)).toBe(true)
    expect(rows[0].days[0].date.getDate()).toBe(1)
  })

  it('is a single row for a one-month range', () => {
    expect(buildMonthRows(resolvePeriodRange('this_month', [], now), new Map())).toHaveLength(1)
  })

  it('pads short months so every row stays column-aligned', () => {
    // September has 30 days, so column 31 is padding and must not be counted.
    const rows = buildMonthRows(resolvePeriodRange('this_month', [], now), new Map())
    expect(rows[0].days[29].inRange).toBe(true) // the 30th
    expect(rows[0].days[30].inRange).toBe(false) // the padded 31st
  })

  it('places each application on its own applicationDate', () => {
    const rows = buildMonthRows(
      resolvePeriodRange('this_month', [], now),
      new Map([['2026-09-07', ['a1', 'a2']]]),
    )
    const seventh = rows[0].days[6]
    expect(seventh.count).toBe(2)
    expect(seventh.level).toBe(2)
    expect(rows[0].days[7].count).toBe(0)
  })

  it('disambiguates month labels when the range crosses a year boundary', () => {
    const january = new Date(2027, 0, 15) // Nov 2026 -> Jan 2027
    const rows = buildMonthRows(resolvePeriodRange('last_3_months', [], january), new Map())
    expect(rows.map(r => r.label)).toEqual(['Nov 26', 'Dec 26', 'Jan 27'])
  })
})

describe('computeHeatmapLayout', () => {
  const WIDTH = 870 // a typical desktop card

  it('keeps cells compact rather than ballooning when fewer days are shown', () => {
    // A day cell must stay recognisably the same object across periods.
    const monthRow = computeHeatmapLayout(DAYS_IN_LONGEST_MONTH, WIDTH, 'month_rows')
    const twelveMonths = computeHeatmapLayout(53, WIDTH, 'contribution')
    expect(monthRow.cellSize).toBeLessThanOrEqual(22)
    expect(monthRow.cellSize / twelveMonths.cellSize).toBeLessThan(2.5)
  })

  it('keeps the 12-month view at roughly its original density', () => {
    const { cellSize } = computeHeatmapLayout(53, WIDTH)
    expect(cellSize).toBeGreaterThanOrEqual(9)
    expect(cellSize).toBeLessThanOrEqual(13)
  })

  it('uses most of the available width instead of leaving a large empty area', () => {
    const cases: [number, 'month_rows' | 'contribution'][] = [
      [DAYS_IN_LONGEST_MONTH, 'month_rows'], [27, 'contribution'], [53, 'contribution'],
    ]
    for (const [columns, mode] of cases) {
      const { gridWidth } = computeHeatmapLayout(columns, WIDTH, mode)
      expect(gridWidth).toBeGreaterThan(WIDTH * 0.55)
      expect(gridWidth).toBeLessThanOrEqual(WIDTH)
    }
  })

  it('never lets cells grow without bound just because the width is there', () => {
    expect(computeHeatmapLayout(DAYS_IN_LONGEST_MONTH, 4000, 'month_rows').cellSize).toBeLessThanOrEqual(22)
    expect(computeHeatmapLayout(27, 4000, 'contribution').cellSize).toBeLessThanOrEqual(18)
    expect(computeHeatmapLayout(53, 4000, 'contribution').cellSize).toBeLessThanOrEqual(13)
  })

  it('shrinks rather than overflowing when the container is narrow', () => {
    const { cellSize, gridWidth } = computeHeatmapLayout(53, 320, 'contribution')
    expect(cellSize).toBeGreaterThanOrEqual(9)
    // A year genuinely cannot fit in 320px at a usable size — that's what the
    // horizontal scroll is for — but the cells must stay legible.
    expect(gridWidth).toBeGreaterThan(0)
  })

  it('scales the gap with the cell size so density stays proportional', () => {
    expect(computeHeatmapLayout(DAYS_IN_LONGEST_MONTH, WIDTH, 'month_rows').gap)
      .toBeGreaterThan(computeHeatmapLayout(53, WIDTH, 'contribution').gap)
  })

  it('is safe with no columns at all', () => {
    expect(computeHeatmapLayout(0, WIDTH)).toMatchObject({ gridWidth: 0 })
  })
})

describe('narrow screens keep short-range cells readable', () => {
  it('holds a month strip at a legible size on a phone and scrolls instead', () => {
    const { cellSize, gridWidth } = computeHeatmapLayout(DAYS_IN_LONGEST_MONTH, 340, 'month_rows')
    expect(cellSize).toBeGreaterThanOrEqual(14)
    expect(gridWidth).toBeGreaterThan(340) // i.e. it will scroll, not shrink
  })

  it('still lets a full year compress, where scrolling would be worse', () => {
    expect(computeHeatmapLayout(53, 340, 'contribution').cellSize).toBeLessThan(14)
  })
})
