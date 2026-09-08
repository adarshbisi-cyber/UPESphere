'use client'

// A searchable single-select. Radix has no combobox primitive, and layering
// a text input inside a DropdownMenu fights its typeahead for keystrokes, so
// this is purpose-built — but it deliberately borrows Select's popover
// styling and highlight treatment so it reads as the same control family.
//
// The panel is portalled to the body and positioned from the trigger's
// viewport rect. It's used inside UploadModalShell, whose panel and field
// area are both `overflow-y-auto`, and an absolutely-positioned dropdown
// would be clipped by them.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const PANEL_MAX_HEIGHT = 288

export interface ComboboxProps {
  value: string
  /**
   * What the trigger shows, when that differs from the value used to match
   * the selected option — e.g. an "Other" selection displaying the custom
   * name the user actually typed.
   */
  displayValue?: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  /** Offers a row that adopts the typed text as a new value. */
  onCreate?: (value: string) => void
  createLabel?: (query: string) => string
  canCreate?: (query: string) => boolean
  id?: string
}

export function Combobox({
  value,
  displayValue,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search',
  emptyLabel = 'No matches found',
  onCreate,
  createLabel = q => `Add "${q}"`,
  canCreate,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter(o => o.toLowerCase().includes(q)) : options
  }, [options, query])

  const showCreate = Boolean(onCreate) && (canCreate ? canCreate(query) : query.trim().length > 0)
  // The create row is one past the end of the list, so arrow keys walk
  // through both without the caller needing to know it exists.
  const rowCount = filtered.length + (showCreate ? 1 : 0)

  const openPanel = () => {
    const node = triggerRef.current
    if (!node) return
    setRect(node.getBoundingClientRect())
    setQuery('')
    setHighlight(0)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const commit = (next: string) => {
    onChange(next)
    close()
  }

  const commitRow = (index: number) => {
    if (index < filtered.length) return commit(filtered[index])
    if (showCreate && onCreate) {
      onCreate(query.trim())
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    // Reposition rather than leaving the panel behind when the page moves.
    const reposition = () => setRect(triggerRef.current?.getBoundingClientRect() ?? null)

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open])

  useEffect(() => { setHighlight(0) }, [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => (rowCount ? (h + 1) % rowCount : 0)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => (rowCount ? (h - 1 + rowCount) % rowCount : 0)); return }
    if (e.key === 'Enter') { e.preventDefault(); if (rowCount) commitRow(highlight); return }
  }

  // Flipped above the trigger when there isn't room below, so the panel is
  // never cut off at the bottom of the viewport.
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0
  const flipUp = rect !== null && spaceBelow < PANEL_MAX_HEIGHT && rect.top > spaceBelow

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? close() : openPanel())}
        style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
          'transition-all duration-200',
          value ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span className="line-clamp-1 text-left">{displayValue || value || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {open && rect && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          onKeyDown={onKeyDown}
          style={{
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: flipUp ? undefined : rect.bottom + 6,
            bottom: flipUp ? window.innerHeight - rect.top + 6 : undefined,
            maxHeight: PANEL_MAX_HEIGHT,
            background: 'hsl(var(--card))',
            border: '1px solid var(--divider)',
          }}
          className="z-50 flex flex-col overflow-hidden rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95"
        >
          {/* Search section: padded, fixed at the top, never scrolls. */}
          <div className="shrink-0 border-b p-2" style={{ borderColor: 'var(--divider)' }}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 box-border transition-colors duration-200',
                'border-[color:var(--divider)] bg-[color:var(--muted-surface)]',
                'focus-within:border-indigo-500/50 focus-within:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]',
              )}
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                // globals.css applies `*:focus-visible { outline; outline-offset: 2px }`
                // app-wide. That offset puts the ring *outside* the element, and on a
                // full-width input it spills past this panel's rounded corners. The
                // wrapper's focus-within border and inset shadow replace it with an
                // indicator that stays inside the field — same colour, contained.
                // Set inline so it wins over the unlayered global rule.
                style={{ outline: 'none' }}
                className="h-8 w-full min-w-0 box-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Only the options scroll. */}
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {filtered.map((option, i) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => commit(option)}
                className={cn(
                  'relative flex w-full cursor-pointer items-center rounded-lg py-1.5 pl-8 pr-2 text-left text-sm outline-none transition-colors duration-200',
                  i === highlight && 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
                  option === value && 'font-medium',
                )}
              >
                {option === value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4 text-indigo-400" />
                  </span>
                )}
                {option}
              </button>
            ))}

            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
            )}

            {showCreate && (
              <>
                {filtered.length === 0 && (
                  <p className="px-3 pb-1 pt-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseEnter={() => setHighlight(filtered.length)}
                  onClick={() => commitRow(filtered.length)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors duration-200',
                    highlight === filtered.length ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'text-indigo-500 dark:text-indigo-400',
                  )}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{createLabel(query.trim())}</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
