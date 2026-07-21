import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Navbar } from '@/components/shared/Navbar'

let pathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}))

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}))

describe('Navbar', () => {
  beforeEach(() => {
    pathname = '/'
  })

  it('links to Community in the desktop navigation', () => {
    render(<Navbar />)

    const communityLink = screen.getByRole('link', { name: /community/i })
    expect(communityLink).toHaveAttribute('href', '/community')
  })

  it('shows Community in the mobile menu after opening it', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))

    const mobileMenu = screen.getByText('Appearance').closest('div')?.parentElement?.parentElement
    expect(mobileMenu).toBeTruthy()
    expect(within(mobileMenu as HTMLElement).getByRole('link', { name: /community/i })).toHaveAttribute(
      'href',
      '/community'
    )
  })

  it('marks Community as active on the community page', () => {
    pathname = '/community'

    render(<Navbar />)

    const communityLinks = screen.getAllByRole('link', { name: /community/i })
    expect(communityLinks[0]).toHaveClass('text-foreground')
  })
})
