import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/20 text-primary-foreground hover:bg-primary/30',
        secondary:
          'border-transparent bg-secondary/20 text-secondary-foreground hover:bg-secondary/30',
        destructive:
          'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30',
        outline:
          'border border-current text-foreground',
        indigo:
          'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        violet:
          'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        emerald:
          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        amber:
          'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        red:
          'bg-red-500/20 text-red-300 border border-red-500/30',
        cyan:
          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
