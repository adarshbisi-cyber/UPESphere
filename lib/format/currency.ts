// Pure formatting/cursor-math helpers for a live-formatted Indian-currency
// input (see components/ui/currency-input.tsx). Kept separate from the React
// component so the actual number/cursor logic — the part worth getting
// exactly right — is unit-testable without a DOM.

// Formats a digit string using Indian numbering (lakh/crore grouping, via
// the en-IN locale) rather than the international thousands grouping —
// 1200000 -> "12,00,000", not "1,200,000".
//
// Strips non-digits before converting rather than trusting the caller: an
// already-formatted or free-text value ("12,00,000", "12 LPA") would
// otherwise reach Number() and render the literal string "NaN" in the
// input. That can't happen while typing (the input only ever hands back
// sanitized digits) but does happen the moment a stored value is loaded
// into the field, which is what the edit flow does. Sanitizing here also
// makes the function idempotent — formatting an already-formatted value
// returns it unchanged instead of corrupting it.
export function formatIndianNumber(digits: string): string {
  const clean = digits.replace(/\D/g, '')
  if (!clean) return ''
  return new Intl.NumberFormat('en-IN').format(Number(clean))
}

// Strips everything but digits, and any leading zeros (a currency amount
// has no meaningful leading zero, and leaving them in would make "01,000"
// format oddly) — but never strips a lone "0" while it's the only digit
// typed so far, since the user may still be about to type more after it.
export function sanitizeDigits(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '')
  return digitsOnly.replace(/^0+(?=\d)/, '')
}

// How many actual digits sit before `index` in a formatted string — the
// stable quantity to preserve across reformatting, since raw character
// index shifts whenever a comma is inserted or removed around the cursor.
export function countDigitsBeforeIndex(str: string, index: number): number {
  let count = 0
  for (let i = 0; i < index && i < str.length; i++) {
    if (/\d/.test(str[i])) count++
  }
  return count
}

// Inverse of the above: the character index in `str` immediately after the
// Nth digit — where the cursor should land post-reformat to preserve the
// same "N digits to my left" position the user had before.
export function indexAfterDigitCount(str: string, digitCount: number): number {
  if (digitCount <= 0) return 0
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (/\d/.test(str[i])) {
      count++
      if (count === digitCount) return i + 1
    }
  }
  return str.length
}
