import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function formatGPA(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

export function getGPAColor(gpa: number, maxScale = 10): string {
  const pct = (gpa / maxScale) * 100
  if (pct >= 80) return 'text-emerald-400'
  if (pct >= 60) return 'text-yellow-400'
  if (pct >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getAttendanceColor(percentage: number, required = 75): string {
  if (percentage >= required + 10) return 'text-emerald-400'
  if (percentage >= required) return 'text-yellow-400'
  return 'text-red-400'
}

export function getAttendanceBg(percentage: number, required = 75): string {
  if (percentage >= required + 10) return 'bg-emerald-500/20 border-emerald-500/30'
  if (percentage >= required) return 'bg-yellow-500/20 border-yellow-500/30'
  return 'bg-red-500/20 border-red-500/30'
}

export function getAttendanceGradient(percentage: number, required = 75): string {
  if (percentage >= required + 10) return 'from-emerald-500 to-green-400'
  if (percentage >= required) return 'from-yellow-500 to-amber-400'
  return 'from-red-500 to-rose-400'
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
