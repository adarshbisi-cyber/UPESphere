import { describe, expect, it } from 'vitest'
import { calculateAttendance } from '@/lib/calculations/attendance'

describe('calculateAttendance', () => {
  // Regression: "Must Attend" is classes still to come, added on top of the
  // total already held — attended + classesNeeded naturally exceeds the
  // *current* total, because classesNeeded hasn't happened yet. Verifies
  // the actual reported case (2 attended / 4 held / 75% required) and that
  // the projection is internally consistent: after attending all of them,
  // the resulting percentage is exactly the required one.
  it('classesNeeded is future classes on top of the current total, not a subset of it', () => {
    const result = calculateAttendance(2, 4, 75)
    expect(result.classesNeeded).toBe(4)

    const projectedTotal = 4 + result.classesNeeded
    const projectedAttended = 2 + result.classesNeeded
    expect((projectedAttended / projectedTotal) * 100).toBeCloseTo(75, 5)
  })

  it('matches the other reported cases exactly', () => {
    expect(calculateAttendance(2, 6, 75).classesNeeded).toBe(10)
    expect(calculateAttendance(4, 8, 75).classesNeeded).toBe(8)
  })

  it('the message states the resulting total explicitly, so it reads as additive rather than a contradiction', () => {
    const result = calculateAttendance(2, 4, 75)
    expect(result.message).toBe('Attend the next 4 classes in a row — that brings your total to 8 and puts you at 75%.')
  })

  it('uses singular "class" for exactly one class needed', () => {
    const result = calculateAttendance(2, 3, 75) // needs exactly 1 more
    expect(result.classesNeeded).toBe(1)
    expect(result.message).toContain('next 1 class ')
    expect(result.message).not.toContain('1 classes')
  })

  it('never reports classes needed when already at or above the requirement', () => {
    const result = calculateAttendance(8, 10, 75)
    expect(result.currentPercentage).toBe(80)
    expect(result.classesNeeded).toBe(0)
    expect(result.message).not.toContain('Attend the next')
  })

  it('safe-bunk count is independent of the classesNeeded projection', () => {
    const result = calculateAttendance(9, 10, 75)
    expect(result.status).toBe('safe')
    expect(result.safeBunks).toBe(2) // 9/(10+2) = 75%
  })
})
