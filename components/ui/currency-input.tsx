'use client'

// A text input for entering a rupee amount: shows a fixed ₹ prefix (never
// part of the editable text, so it can't ever be deleted or interfere with
// cursor math) and live-formats whatever's typed using Indian lakh/crore
// grouping. The caller only ever sees/sets the clean digit string — the
// comma formatting is purely a display concern of this component.

import { useRef } from 'react'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  countDigitsBeforeIndex, formatIndianNumber, indexAfterDigitCount, sanitizeDigits,
} from '@/lib/format/currency'

export interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value: string // clean digits only, e.g. "1200000" — never formatted, never includes ₹
  onChange: (digits: string) => void
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const formatted = formatIndianNumber(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const cursor = el.selectionStart ?? el.value.length
    // How many digits are to the left of the cursor *right now*, in what the
    // browser is currently showing — that's what has to stay put once we
    // reformat, since raw character position shifts as commas move around.
    const digitsBeforeCursor = countDigitsBeforeIndex(el.value, cursor)
    const digits = sanitizeDigits(el.value)

    onChange(digits)

    // The re-render that applies the new formatted value happens after this
    // handler returns — restore the cursor on the next frame, once it has.
    requestAnimationFrame(() => {
      const node = inputRef.current
      if (!node) return
      const nextFormatted = formatIndianNumber(digits)
      const nextPos = indexAfterDigitCount(nextFormatted, digitsBeforeCursor)
      node.setSelectionRange(nextPos, nextPos)
    })
  }

  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70 pointer-events-none select-none"
        aria-hidden="true"
      >
        ₹
      </span>
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatted}
        onChange={handleChange}
        className={cn('pl-7', className)}
        {...props}
      />
    </div>
  )
}
