// Client-side auth form validation. Supabase enforces its own rules server
// side too — this just gates the buttons and gives live feedback so users
// aren't submitting known-bad input.

export function isValidName(name: string): boolean {
  return name.trim().length >= 2
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export interface PasswordChecks {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

export function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    // Matches Supabase's "Lowercase, uppercase letters, digits and symbols"
    // password policy — anything that isn't a letter or digit counts.
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

export function isValidPassword(pw: string): boolean {
  const c = checkPassword(pw)
  return c.length && c.uppercase && c.lowercase && c.number && c.special
}
