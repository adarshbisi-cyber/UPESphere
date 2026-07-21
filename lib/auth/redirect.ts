// A `redirect` query param is attacker-controlled input (it arrives on a link
// someone else can craft, e.g. `/login?redirect=https://evil.example`), so it
// must never be handed straight to a Location header or router.push without
// validation — that's an open redirect. Only a same-origin path starting with
// exactly one `/` is accepted; anything else (an absolute URL, `//host` which
// browsers treat as protocol-relative, or a bare string) falls back safely.
export function safeRedirectPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}
