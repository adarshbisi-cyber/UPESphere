'use client'

// Shared dropdown-menu primitive, styled to match components/ui/select.tsx
// so every popover surface in the app reads the same. Built on Radix, which
// hands us the fiddly parts for free and correctly: click-outside to close,
// Escape to close, roving arrow-key navigation, focus returned to the
// trigger on close, and correct aria-* wiring.
//
// Content is portalled to document.body — the same reason UploadModalShell
// portals (see its comment). A menu opened from inside a scrolling list or a
// GlassCard would otherwise be clipped by that ancestor's overflow/stacking
// context, which is exactly what bites on narrow screens.

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, align = 'end', ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={12}
      style={{ background: 'hsl(var(--card))', border: '1px solid var(--divider)', transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)' }}
      className={cn(
        'z-50 min-w-[11rem] overflow-hidden rounded-xl p-1 text-popover-foreground shadow-2xl backdrop-blur-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

// `destructive` swaps the indigo highlight for red. Same `data-[highlighted]`
// mechanism as SelectItem (Radix sets it for both pointer hover and arrow-key
// navigation, so one rule covers mouse and keyboard), plus an `active:` tint
// for touch devices, which never hover.
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }
>(({ className, destructive = false, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none',
      'transition-colors duration-200',
      destructive
        ? [
            'text-red-600 dark:text-red-400',
            'data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-600 dark:data-[highlighted]:text-red-300',
            'active:bg-red-500/15',
          ]
        : [
            'text-foreground',
            'data-[highlighted]:bg-indigo-500/10 data-[highlighted]:text-indigo-600 dark:data-[highlighted]:text-indigo-300',
            'active:bg-indigo-500/15',
          ],
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    style={{ background: 'var(--divider)' }}
    className={cn('-mx-1 my-1 h-px', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
}
