import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CommunityTeaser } from '@/components/community/CommunityTeaser'

describe('CommunityTeaser', () => {
  it('renders the community teaser and feature-suggestion CTA', () => {
    render(<CommunityTeaser />)

    expect(screen.getByRole('heading', { name: /your people are gathering/i })).toBeInTheDocument()
    expect(screen.getByText(/study squads, peer q&a, campus chatter/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /suggest a feature/i })).toHaveAttribute(
      'href',
      'https://forms.gle/nNT7KWYXobfXBUTM8'
    )
  })

  it('shows the community feature preview chips', () => {
    render(<CommunityTeaser />)

    expect(screen.getByText('Study squads')).toBeInTheDocument()
    expect(screen.getByText('Peer Q&A')).toBeInTheDocument()
    expect(screen.getByText('Campus chatter')).toBeInTheDocument()
    expect(screen.getByText('Notes worth stealing')).toBeInTheDocument()
  })
})
