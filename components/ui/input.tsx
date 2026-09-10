import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-[color:var(--divider)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200',
          // Focus is drawn INSIDE the input's own box. The previous
          // `ring-2` spread 2px outside it, and globals.css's
          // `*:focus-visible` outline added another 2px at a 2px offset on
          // top — a ~6px double halo that overflowed tight layouts (an
          // input sitting next to a Save button inside a modal). An inset
          // ring follows the border-radius exactly and can't overlap a
          // neighbour (`ring-inset` draws it inside the box, not around it). `outline` is killed via style= below, since that
          // global rule is unlayered and outranks any utility class here.
          'focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          className
        )}
        style={{ background: 'var(--muted-surface)', outline: 'none' }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
