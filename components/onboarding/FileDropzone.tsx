'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FileDropzone({
  accept,
  onFile,
  icon: Icon = Upload,
  label = 'Drop your file here',
  sublabel = 'or click to browse',
  file,
  onClear,
}: {
  accept: string
  onFile: (file: File) => void
  icon?: LucideIcon
  label?: string
  sublabel?: string
  file: File | null
  onClear: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    const f = files?.[0]
    if (f) onFile(f)
  }, [onFile])

  if (file) {
    return (
      <div
        className="rounded-xl border p-4 flex items-center gap-3"
        style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
      >
        <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="text-sm text-foreground/90 flex-1 truncate">{file.name}</span>
        <button
          onClick={onClear}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <motion.div
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer select-none transition-colors',
        isDragging ? 'border-indigo-500/70 bg-indigo-500/[0.06]' : 'border-indigo-500/25 hover:border-indigo-500/45 hover:bg-indigo-500/[0.03]'
      )}
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))', border: '1px solid rgba(99,102,241,0.3)' }}>
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </motion.div>
  )
}
