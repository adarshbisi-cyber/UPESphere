import { describe, expect, it } from 'vitest'
import { isValidMeetingLink, normaliseMeetingLink, validateMeetingLink } from '@/lib/practiceTogether/meetingLink'

describe('validateMeetingLink', () => {
  it('accepts the services hosts actually use', () => {
    for (const link of [
      'https://meet.google.com/abc-defg-hij',
      'https://zoom.us/j/1234567890',
      'https://teams.microsoft.com/l/meetup-join/xyz',
      'https://discord.gg/abcd',
      'https://webex.com/meet/room',
    ]) {
      expect(validateMeetingLink(link), link).toBeNull()
    }
  })

  it('accepts a link pasted without a scheme', () => {
    expect(validateMeetingLink('meet.google.com/abc-defg-hij')).toBeNull()
    expect(normaliseMeetingLink('meet.google.com/abc')).toBe('https://meet.google.com/abc')
  })

  it('leaves an explicit scheme alone rather than rewriting it', () => {
    expect(normaliseMeetingLink('http://meet.example.com/x')).toBe('http://meet.example.com/x')
  })

  it('rejects an empty link with a message about what to add', () => {
    expect(validateMeetingLink('')?.message).toContain('participants will use to join')
    expect(validateMeetingLink('   ')?.message).toContain('participants will use to join')
  })

  it('rejects text that is not a link', () => {
    for (const junk of ['not a link', 'meet', 'hello world', '???']) {
      expect(isValidMeetingLink(junk), junk).toBe(false)
    }
  })

  it('rejects a non-web scheme rather than silently prefixing it', () => {
    // Guards against a javascript: or mailto: value reaching an href.
    expect(validateMeetingLink('javascript:alert(1)')?.message).toContain('https://')
    expect(isValidMeetingLink('mailto:someone@example.com')).toBe(false)
  })

  it('rejects a hostname that could never resolve', () => {
    expect(isValidMeetingLink('https://')).toBe(false)
    expect(isValidMeetingLink('https://localhostwithoutdot')).toBe(false)
  })

  it('trims surrounding whitespace from a pasted link', () => {
    expect(validateMeetingLink('  https://meet.google.com/abc  ')).toBeNull()
  })
})
