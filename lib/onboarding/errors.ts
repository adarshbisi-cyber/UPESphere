// Supabase/Postgrest errors carry the useful detail in .message (and often
// .code / .details / .hint) rather than in a generic Error — surface that
// verbatim so a failure is self-diagnosing instead of a dead end.
export function describeSaveError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [e.message, e.details, e.hint].filter(Boolean)
    if (parts.length > 0) return parts.join(' — ') + (e.code ? ` (${e.code})` : '')
  }
  if (err instanceof Error) return err.message
  return "Couldn't save that — check your connection and try again."
}
