// Shared display helpers for the Weekly Timetable and Today's Classes
// widgets, so the same subject always gets the same colour and every time
// string renders in the same 12-hour format across both.

const SUBJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#ef4444', '#3b82f6']

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

// Deterministic colour per subject so the same class always renders the same
// colour everywhere, without needing a stored colour assignment.
export function colorForSubject(subject: string): string {
  let hash = 0
  for (let i = 0; i < subject.length; i++) hash = (hash * 31 + subject.charCodeAt(i)) | 0
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

export function formatTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

export function formatTimeRange12h(startTime: string, endTime: string): string {
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`
}

export function formatDuration(startTime: string, endTime: string): string {
  const diff = Math.max(0, toMinutes(endTime) - toMinutes(startTime))
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} hr`
  return `${h} hr ${m} min`
}

export function formatRoom(room: string | null): string | null {
  return room ? `📍 Room No. ${room}` : null
}

export function formatMinutes(mins: number): string {
  const rounded = Math.max(1, Math.round(mins))
  if (rounded < 60) return `${rounded} min`
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}
