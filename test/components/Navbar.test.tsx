import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { Navbar } from '@/components/shared/Navbar'

let pathname = '/'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockUser: any = null

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}))

vi.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}))

// framer-motion's AnimatePresence/motion.* rely on real animation-frame
// timing to settle their enter state, which jsdom never provides — the
// dropdown content ends up in the raw DOM but getByRole('link') (which
// respects computed visibility) can't see it. Passthrough components sidestep
// that entirely: children render immediately and deterministically.
vi.mock('framer-motion', () => {
  const passthrough = (tag: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function MotionPassthrough({ children, ...props }: any) {
      const {
        initial, animate, exit, transition, variants, custom,
        whileHover, whileTap, whileFocus, whileInView, layout, layoutId,
        ...domProps
      } = props
      void initial; void animate; void exit; void transition; void variants; void custom
      void whileHover; void whileTap; void whileFocus; void whileInView; void layout; void layoutId
      const Tag = tag as 'div'
      return <Tag {...domProps}>{children}</Tag>
    }
  }
  return {
    motion: new Proxy({}, { get: (_target, tag: string) => passthrough(tag) }),
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

describe('Navbar', () => {
  beforeEach(() => {
    pathname = '/'
    mockUser = null
  })

  it('no longer shows TeamUp as a standalone top-level link', () => {
    render(<Navbar />)

    expect(screen.queryByRole('link', { name: /^teamup$/i })).toBeNull()
    expect(screen.getByRole('button', { name: /community/i })).toBeInTheDocument()
  })

  it('opens the Community dropdown to reveal TeamUp and the existing Community page', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /community/i }))

    // NavDropdown items render with an explicit role="menuitem", not the
    // native link role — mobile's accordion items don't override role, so
    // that variant below still queries by 'link'.
    expect(screen.getByRole('menuitem', { name: /teamup/i })).toHaveAttribute('href', '/teamup')
    expect(screen.getByRole('menuitem', { name: /community feed/i })).toHaveAttribute('href', '/community')
  })

  it('shows Community and TeamUp inside the mobile menu after opening it', () => {
    render(<Navbar />)

    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }))

    const mobileMenu = screen.getByText('Appearance').closest('div')?.parentElement?.parentElement
    expect(mobileMenu).toBeTruthy()

    fireEvent.click(within(mobileMenu as HTMLElement).getByRole('button', { name: /community/i }))

    expect(within(mobileMenu as HTMLElement).getByRole('link', { name: /teamup/i })).toHaveAttribute('href', '/teamup')
    expect(within(mobileMenu as HTMLElement).getByRole('link', { name: /community feed/i })).toHaveAttribute(
      'href',
      '/community'
    )
  })

  it('marks Community as active while viewing a TeamUp route', () => {
    pathname = '/teamup'

    render(<Navbar />)

    expect(screen.getByRole('button', { name: /community/i })).toHaveClass('text-indigo-400')
  })

  it('marks Community as active on the community page too', () => {
    pathname = '/community'

    render(<Navbar />)

    expect(screen.getByRole('button', { name: /community/i })).toHaveClass('text-indigo-400')
  })

  it('falls back to the initials avatar when the profile image fails to load', () => {
    mockUser = {
      email: 'adarshbisi@gmail.com',
      user_metadata: { full_name: 'Adarsh Bisi', avatar_url: 'https://lh3.googleusercontent.com/broken' },
    }

    const { container } = render(<Navbar />)

    const img = container.querySelector('img')
    expect(img).toBeTruthy()

    fireEvent.error(img as HTMLImageElement)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getAllByText('AB').length).toBeGreaterThan(0)
  })
})
