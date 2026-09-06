import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable'
import { getActiveTimetable } from '@/lib/onboarding/api'

vi.mock('@/lib/onboarding/api', () => ({
  getActiveTimetable: vi.fn(),
}))

// The real modal drives PDF parsing and Supabase writes — irrelevant here.
// This stub only needs to prove the *same* component gets mounted and that
// its onSaved callback is what drives the refresh.
vi.mock('@/components/workspace/TimetableUploadModal', () => ({
  TimetableUploadModal: ({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) => (
    <div role="dialog" aria-label="Timetable upload modal">
      <button onClick={onSaved}>Simulate save</button>
      <button onClick={onClose}>Simulate close</button>
    </div>
  ),
}))

const mockGetActiveTimetable = vi.mocked(getActiveTimetable)

const SAMPLE_SLOT = {
  day: 'Monday', date: null, startTime: '09:00', endTime: '10:00', subject: 'Test Subject', room: 'R1',
}

describe('WeeklyTimetable — Upload Timetable button', () => {
  beforeEach(() => {
    mockGetActiveTimetable.mockReset()
    mockGetActiveTimetable.mockResolvedValue({
      version: { id: 'v1', version: 1, effectiveFrom: '2026-01-01' },
      slots: [SAMPLE_SLOT],
    })
  })

  it('renders "Upload Timetable" as a sibling of the heading in the header row', async () => {
    render(<WeeklyTimetable userId="u1" />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Weekly Timetable' })).toBeInTheDocument())

    const heading = screen.getByRole('heading', { name: 'Weekly Timetable' })
    const button = screen.getByRole('button', { name: /upload timetable/i })
    // Same header row (shared parent), not buried elsewhere in the card —
    // this is what makes it land "on the right" of a `justify-between` row.
    expect(button.parentElement).toBe(heading.parentElement!.parentElement)
  })

  it('opens the exact same TimetableUploadModal used by the Academic Workspace card', async () => {
    render(<WeeklyTimetable userId="u1" />)
    await waitFor(() => screen.getByRole('heading', { name: 'Weekly Timetable' }))

    expect(screen.queryByRole('dialog', { name: /timetable upload modal/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /upload timetable/i }))
    expect(screen.getByRole('dialog', { name: /timetable upload modal/i })).toBeInTheDocument()
  })

  it('refetches its own data and notifies the parent after a save, so every dependent widget updates', async () => {
    const onTimetableChanged = vi.fn()
    render(<WeeklyTimetable userId="u1" onTimetableChanged={onTimetableChanged} />)
    await waitFor(() => screen.getByRole('heading', { name: 'Weekly Timetable' }))

    await userEvent.click(screen.getByRole('button', { name: /upload timetable/i }))
    expect(mockGetActiveTimetable).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Simulate save' }))

    expect(onTimetableChanged).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(mockGetActiveTimetable).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /timetable upload modal/i })).not.toBeInTheDocument())
  })

  it('refetches when refreshKey changes — picks up an upload made from elsewhere (the Academic Workspace card)', async () => {
    const { rerender } = render(<WeeklyTimetable userId="u1" refreshKey={0} />)
    await waitFor(() => expect(mockGetActiveTimetable).toHaveBeenCalledTimes(1))

    rerender(<WeeklyTimetable userId="u1" refreshKey={1} />)
    await waitFor(() => expect(mockGetActiveTimetable).toHaveBeenCalledTimes(2))
  })
})
