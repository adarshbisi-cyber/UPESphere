'use client'

import { AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'

// A styled in-system replacement for the browser's native confirm() —
// destructive actions get the same focus-trapped, Escape-to-close, themed
// modal as everything else, instead of dropping out of the design system
// into an unstyled OS dialog.
export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = true,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <UploadModalShell onClose={onClose} maxWidth="max-w-sm">
      <div className="flex items-start gap-3 mb-3 pr-6">
        {destructive && (
          <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
        )}
        <h2 className="text-base font-semibold font-display pt-1.5">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        <Button
          variant={destructive ? 'destructive' : 'gradient'}
          className="flex-1"
          onClick={() => { onConfirm(); onClose() }}
        >
          {confirmLabel}
        </Button>
      </div>
    </UploadModalShell>
  )
}
