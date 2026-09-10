import { describe, expect, it } from 'vitest'
import {
  buildPracticeMonthRows, buildPracticeWeeks, completedSessionsFor, computeBalanceInsight,
  computePracticeMix, computePracticeSummary, computeStreak, groupPracticeByDay,
  practiceHeatmapModeFor, resolvePracticeRange,
} from '@/lib/practiceTogether/practiceActivity'
import { toIsoDay } from '@/lib/shared/calendarGrid'
import type { PracticeSession, PracticeType, SessionStatus } from '@/lib/practiceTogether/types'

let seq = 0
function session(
  scheduledDate: string, practiceType: PracticeType = 'case_prep',
  status: SessionStatus = 'completed', memberIds: string[] = ['me'],
): PracticeSession {
  seq++
  return {
    id: `s${seq}`, creatorId: memberIds[0], practiceType, customPracticeType: null,
    title: 'Practice', description: null, scheduledDate, startTime: '19:00', durationMinutes: 60,
    mode: 'online', location: null, meetingLink: null, experienceLevel: 'any', collegePreference: 'any',
    minParticipants: 2, maxParticipants: 2, currentParticipants: memberIds.length, status,
    typeSpecific: {}, createdAt: '', updatedAt: '', creator: null,
    participants: memberIds.map((u, i) => ({
      id: `p${seq}-${i}`, sessionId: `s${seq}`, userId: u,
      role: i === 0 ? 'host' as const : 'participant' as const, joinedAt: '', profile: null,
    })),
  }
}

describe('completedSessionsFor', () => {
  it('counts only sessions that actually happened', () => {
    const all = [
      session('2026-09-01', 'case_prep', 'completed'),
      session('2026-09-02', 'case_prep', 'open'),
      session('2026-09-03', 'case_prep', 'full'),
      session('2026-09-04', 'case_prep', 'cancelled'),
    ]
    expect(completedSessionsFor(all, 'me')).toHaveLength(1)
  })

  it('counts only sessions the user was actually in', () => {
    const all = [
      session('2026-09-01', 'case_prep', 'completed', ['me']),
      session('2026-09-02', 'case_prep', 'completed', ['someone-else']),
      session('2026-09-03', 'case_prep', 'completed', ['host', 'me']),
    ]
    expect(completedSessionsFor(all, 'me').map(s => s.scheduledDate)).toEqual(['2026-09-01', '2026-09-03'])
  })
})

describe('groupPracticeByDay', () => {
  it('breaks a day down by practice type rather than a single total', () => {
    const byDay = groupPracticeByDay([
      session('2026-09-10', 'case_prep'),
      session('2026-09-10', 'case_prep'),
      session('2026-09-10', 'guesstimate'),
    ])
    expect(byDay.get('2026-09-10')).toEqual({ case_prep: 2, guesstimate: 1 })
  })

  it('keeps days separate', () => {
    const byDay = groupPracticeByDay([session('2026-09-10'), session('2026-09-11', 'aptitude')])
    expect(byDay.get('2026-09-10')).toEqual({ case_prep: 1 })
    expect(byDay.get('2026-09-11')).toEqual({ aptitude: 1 })
  })
})

describe('day cells', () => {
  const now = new Date(2026, 8, 15) // September 2026

  it('orders segments by how much of the day each type took', () => {
    const byDay = groupPracticeByDay([
      session('2026-09-10', 'guesstimate'),
      session('2026-09-10', 'case_prep'),
      session('2026-09-10', 'case_prep'),
    ])
    const rows = buildPracticeMonthRows(resolvePracticeRange('this_month', now), byDay)
    const tenth = rows[0].days.find(d => d.iso === '2026-09-10')!
    expect(tenth.total).toBe(3)
    expect(tenth.segments.map(s => s.type)).toEqual(['case_prep', 'guesstimate'])
    expect(tenth.segments[0].count).toBe(2)
  })

  it('leaves days with no practice empty rather than absent', () => {
    const rows = buildPracticeMonthRows(resolvePracticeRange('this_month', now), new Map())
    expect(rows[0].days.every(d => d.total === 0 && d.segments.length === 0)).toBe(true)
  })

  it('pads short months so rows stay column-aligned, without inventing days', () => {
    const rows = buildPracticeMonthRows(resolvePracticeRange('this_month', now), new Map())
    expect(rows[0].days).toHaveLength(31)
    expect(rows[0].days[29].inRange).toBe(true)  // 30 September
    expect(rows[0].days[30].inRange).toBe(false) // padded 31st
  })

  it('lays out whole weeks in the contribution view', () => {
    const { weeks, monthLabels } = buildPracticeWeeks(resolvePracticeRange('last_3_months', now), new Map())
    expect(weeks.every(w => w.days.length === 7)).toBe(true)
    expect(monthLabels.map(m => m.label)).toEqual(['Jul', 'Aug', 'Sep'])
  })
})

describe('resolvePracticeRange', () => {
  const now = new Date(2026, 8, 15) // Tuesday 15 September 2026

  it('covers the current Sunday-to-Saturday week', () => {
    const { start, end } = resolvePracticeRange('this_week', now)
    expect(toIsoDay(start)).toBe('2026-09-13')
    expect(toIsoDay(end)).toBe('2026-09-19')
  })

  it('covers the calendar month and the longer windows', () => {
    expect(toIsoDay(resolvePracticeRange('this_month', now).start)).toBe('2026-09-01')
    expect(toIsoDay(resolvePracticeRange('last_3_months', now).start)).toBe('2026-07-01')
    expect(toIsoDay(resolvePracticeRange('last_12_months', now).start)).toBe('2025-10-01')
  })

  it('uses compact rows for short ranges and the contribution grid for long ones', () => {
    expect(practiceHeatmapModeFor('this_week')).toBe('month_rows')
    expect(practiceHeatmapModeFor('this_month')).toBe('month_rows')
    for (const p of ['last_3_months', 'last_6_months', 'last_12_months'] as const) {
      expect(practiceHeatmapModeFor(p)).toBe('contribution')
    }
  })
})

describe('computeStreak', () => {
  const now = new Date(2026, 8, 15)

  it('counts consecutive days ending today', () => {
    const byDay = groupPracticeByDay([session('2026-09-15'), session('2026-09-14'), session('2026-09-13')])
    expect(computeStreak(byDay, now)).toBe(3)
  })

  it('survives the morning before today’s practice by counting through yesterday', () => {
    const byDay = groupPracticeByDay([session('2026-09-14'), session('2026-09-13')])
    expect(computeStreak(byDay, now)).toBe(2)
  })

  it('is broken by a missed day', () => {
    const byDay = groupPracticeByDay([session('2026-09-15'), session('2026-09-13'), session('2026-09-12')])
    expect(computeStreak(byDay, now)).toBe(1)
  })

  it('is zero when the last practice was a while ago', () => {
    expect(computeStreak(groupPracticeByDay([session('2026-09-01')]), now)).toBe(0)
  })

  it('is zero with no practice at all', () => {
    expect(computeStreak(new Map(), now)).toBe(0)
  })

  it('counts a day once however many sessions it held', () => {
    const byDay = groupPracticeByDay([session('2026-09-15'), session('2026-09-15', 'aptitude')])
    expect(computeStreak(byDay, now)).toBe(1)
  })
})

describe('computePracticeSummary', () => {
  const now = new Date(2026, 8, 15) // Tuesday

  it('separates this week from this month', () => {
    const sessions = [
      session('2026-09-14'), // this week
      session('2026-09-02'), // earlier this month
      session('2026-08-20'), // last month
    ]
    const summary = computePracticeSummary(sessions, groupPracticeByDay(sessions), now)
    expect(summary.thisWeek).toBe(1)
    expect(summary.thisMonth).toBe(2)
  })

  it('names the most practised format', () => {
    const sessions = [
      session('2026-09-01', 'case_prep'), session('2026-09-02', 'case_prep'),
      session('2026-09-03', 'aptitude'),
    ]
    const summary = computePracticeSummary(sessions, groupPracticeByDay(sessions), now)
    expect(summary.mostPractised).toMatchObject({ type: 'case_prep', count: 2 })
  })

  it('has no most-practised format with nothing completed', () => {
    expect(computePracticeSummary([], new Map(), now).mostPractised).toBeNull()
  })
})

describe('computePracticeMix', () => {
  it('ranks formats by volume and reports each share', () => {
    const mix = computePracticeMix([
      session('2026-09-01', 'case_prep'), session('2026-09-02', 'case_prep'),
      session('2026-09-03', 'case_prep'), session('2026-09-04', 'guesstimate'),
    ])
    expect(mix[0]).toMatchObject({ type: 'case_prep', count: 3 })
    expect(mix[0].share).toBeCloseTo(0.75)
    expect(mix[1]).toMatchObject({ type: 'guesstimate', count: 1 })
  })

  it('is empty with nothing completed', () => {
    expect(computePracticeMix([])).toEqual([])
  })
})

describe('computeBalanceInsight', () => {
  const many = (type: PracticeType, n: number) =>
    Array.from({ length: n }, (_, i) => session(`2026-09-${String(i + 1).padStart(2, '0')}`, type))

  it('says nothing from a handful of sessions', () => {
    expect(computeBalanceInsight(computePracticeMix(many('case_prep', 4)))).toBeNull()
  })

  it('flags a genuinely lopsided mix once there is enough of it', () => {
    const mix = computePracticeMix([...many('case_prep', 8), session('2026-09-20', 'aptitude')])
    expect(computeBalanceInsight(mix)).toContain('heavily focused on case prep')
  })

  it('says nothing when practice is reasonably spread', () => {
    const mix = computePracticeMix([
      ...many('case_prep', 3),
      session('2026-09-21', 'aptitude'), session('2026-09-22', 'guesstimate'),
      session('2026-09-23', 'hr_interview'),
    ])
    expect(computeBalanceInsight(mix)).toBeNull()
  })

  it('says nothing at all with no practice', () => {
    expect(computeBalanceInsight([])).toBeNull()
  })
})
