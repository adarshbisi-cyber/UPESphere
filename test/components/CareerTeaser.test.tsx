import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CareerTeaser } from '@/components/career/CareerTeaser'

describe('CareerTeaser', () => {
  it('invites students to suggest a feature from the career teaser', () => {
    render(<CareerTeaser />)

    expect(screen.getByRole('heading', { name: /your launchpad is being built/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /suggest a feature/i })).toHaveAttribute(
      'href',
      'https://forms.gle/nNT7KWYXobfXBUTM8'
    )
    expect(screen.queryByRole('link', { name: /get on the early list/i })).not.toBeInTheDocument()
  })

  it('shows the career feature preview chips', () => {
    render(<CareerTeaser />)

    expect(screen.getByText('Internship board')).toBeInTheDocument()
    expect(screen.getByText('Placement prep')).toBeInTheDocument()
    expect(screen.getByText('Opportunity matching')).toBeInTheDocument()
    expect(screen.getByText('Resume tools')).toBeInTheDocument()
  })
})
