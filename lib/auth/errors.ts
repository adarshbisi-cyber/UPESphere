// Maps raw Supabase auth error text to friendly, user-facing messages. Supabase
// messages are terse and sometimes leak intent ("Invalid login credentials"),
// so we rewrite the common ones and fall back to the original otherwise.
export function friendlyAuthError(message: string | undefined | null): string {
  if (!message) return 'Something went wrong. Please try again.'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in.'
  }
  if (m.includes('email not confirmed')) {
    return 'Please verify your email before signing in — check your inbox for the link.'
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('for security purposes')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (m.includes('password should be at least') || m.includes('weak password') || m.includes('should contain')) {
    return 'Password must be 8+ characters with upper, lower, a number, and a special character.'
  }
  if (m.includes('unable to validate email') || m.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (m.includes('same password') || m.includes('should be different')) {
    return 'Your new password must be different from your old one.'
  }
  return message
}
