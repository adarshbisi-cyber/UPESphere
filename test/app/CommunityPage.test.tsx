import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CommunityPage, { metadata } from '@/app/community/page'

vi.mock('@/components/shared/Navbar', () => ({
  Navbar: () => <nav>Mock Navbar</nav>,
}))

vi.mock('@/components/landing/Footer', () => ({
  Footer: () => <footer>Mock Footer</footer>,
}))

vi.mock('@/components/community/CommunityTeaser', () => ({
  CommunityTeaser: () => <section>Mock Community Teaser</section>,
}))

describe('CommunityPage', () => {
  it('sets community-specific metadata', () => {
    expect(metadata.title).toBe('Community')
    expect(metadata.description).toMatch(/UPESphere Community is on the way/i)
    expect(metadata.openGraph).toMatchObject({
      title: 'Community — UPESphere',
      description: 'Study squads, peer Q&A, and campus chatter. Your people are gathering.',
    })
  })

  it('renders the community page shell', () => {
    render(<CommunityPage />)

    expect(screen.getByText('Mock Navbar')).toBeInTheDocument()
    expect(screen.getByText('Mock Community Teaser')).toBeInTheDocument()
    expect(screen.getByText('Mock Footer')).toBeInTheDocument()
  })
})
