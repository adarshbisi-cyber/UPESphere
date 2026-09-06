import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// public_profiles and public_competition_profiles are SECURITY DEFINER views
// (Supabase's linter flags this as "critical") — intentionally, since
// profiles/competition_profiles both restrict SELECT to `auth.uid() = id`,
// and TeamUp needs to show OTHER users' safe data (see the guard comments
// above each view in supabase/teamup-migration.sql for why `security_invoker
// = on` would silently break TeamUp instead of just being "more secure").
//
// The actual risk isn't the SECURITY DEFINER property — it's someone later
// adding a sensitive column to one of these views' select lists without
// realizing it becomes world-readable (no RLS applies to a definer view's
// own select). This test statically parses the migration SQL so that
// mistake fails CI instead of shipping.
const migrationSql = readFileSync(
  join(__dirname, '../../supabase/teamup-migration.sql'),
  'utf-8'
)

function extractViewColumns(sql: string, viewName: string, fromTable: string): string[] {
  const pattern = new RegExp(
    `create or replace view public\\.${viewName} as\\s+select\\s+([\\s\\S]*?)\\s+from\\s+public\\.${fromTable}\\b`,
    'i'
  )
  const match = sql.match(pattern)
  if (!match) {
    throw new Error(`Could not find "create or replace view public.${viewName}" in teamup-migration.sql`)
  }
  return match[1]
    .split(',')
    .map(col => col.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
}

describe('TeamUp public-safe view column allowlists', () => {
  it('public_profiles never selects email or resume_file_url', () => {
    const columns = extractViewColumns(migrationSql, 'public_profiles', 'profiles')

    expect(columns).toEqual(['id', 'full_name', 'avatar_url', 'university_id'])
    expect(columns).not.toContain('email')
    expect(columns).not.toContain('resume_file_url')
  })

  it('public_competition_profiles never selects whatsapp_number', () => {
    const columns = extractViewColumns(migrationSql, 'public_competition_profiles', 'competition_profiles')

    expect(columns).toEqual([
      'user_id', 'looking_for_team', 'availability', 'experience_level',
      'competitions_completed', 'bio', 'share_whatsapp_with_teammates', 'share_email_with_teammates',
    ])
    expect(columns).not.toContain('whatsapp_number')
  })
})
