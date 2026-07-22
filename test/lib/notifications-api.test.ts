import { describe, expect, it } from 'vitest'
import { formatRelativeTime, formatUnreadBadge } from '@/lib/notifications/api'

const NOW = new Date('2026-07-22T12:00:00.000Z')

function minutesAgo(n: number): string {
  return new Date(NOW.getTime() - n * 60_000).toISOString()
}

function hoursAgo(n: number): string {
  return new Date(NOW.getTime() - n * 60 * 60_000).toISOString()
}

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60_000).toISOString()
}

describe('formatRelativeTime', () => {
  it('shows "Just now" for under a minute', () => {
    expect(formatRelativeTime(minutesAgo(0.5), NOW)).toBe('Just now')
  })

  it('shows minutes for under an hour', () => {
    expect(formatRelativeTime(minutesAgo(2), NOW)).toBe('2m ago')
    expect(formatRelativeTime(minutesAgo(59), NOW)).toBe('59m ago')
  })

  it('shows hours for under a day', () => {
    expect(formatRelativeTime(hoursAgo(1), NOW)).toBe('1h ago')
    expect(formatRelativeTime(hoursAgo(23), NOW)).toBe('23h ago')
  })

  it('shows "Yesterday" for 1-2 days', () => {
    expect(formatRelativeTime(hoursAgo(30), NOW)).toBe('Yesterday')
  })

  it('shows days for under a week', () => {
    expect(formatRelativeTime(daysAgo(3), NOW)).toBe('3d ago')
  })

  it('falls back to a short date beyond a week', () => {
    expect(formatRelativeTime(daysAgo(10), NOW)).toBe(new Date(daysAgo(10)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  })
})

describe('formatUnreadBadge', () => {
  it('shows the exact count up to 9', () => {
    expect(formatUnreadBadge(1)).toBe('1')
    expect(formatUnreadBadge(9)).toBe('9')
  })

  it('shows "9+" for 10-99', () => {
    expect(formatUnreadBadge(10)).toBe('9+')
    expect(formatUnreadBadge(99)).toBe('9+')
  })

  it('shows "99+" beyond 99', () => {
    expect(formatUnreadBadge(100)).toBe('99+')
  })
})
