// Meeting-link validation, kept pure so the create form, the host editor
// and the tests all agree on what counts as a usable link.
//
// Deliberately permissive about *which* service: hosts use Meet, Zoom,
// Teams, Discord, or their college's own tool, and an allow-list would
// reject working links for no benefit. What's checked is that the value is
// a real absolute http(s) URL with a host — enough to make "Join Meeting"
// actually go somewhere.

export interface MeetingLinkError {
  message: string
}

export function normaliseMeetingLink(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  // A pasted "meet.google.com/abc" is a link the host meant; adding the
  // scheme is kinder than rejecting it. Anything that already carries a
  // scheme is left exactly as typed — including `javascript:` — so a
  // dangerous scheme fails validation on its own terms instead of being
  // rewritten into something that superficially looks like a web URL.
  // Matches a scheme with or without `//`, since `javascript:alert(1)` has
  // no slashes.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function validateMeetingLink(raw: string): MeetingLinkError | null {
  const value = normaliseMeetingLink(raw)
  if (!value) return { message: 'Add the link participants will use to join.' }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { message: "That doesn't look like a valid link." }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { message: 'Use a web link starting with https://' }
  }
  // "https://" alone parses, and a hostname with no dot can't resolve to a
  // real meeting room.
  if (!url.hostname || !url.hostname.includes('.')) {
    return { message: "That doesn't look like a valid link." }
  }
  return null
}

export function isValidMeetingLink(raw: string): boolean {
  return validateMeetingLink(raw) === null
}
