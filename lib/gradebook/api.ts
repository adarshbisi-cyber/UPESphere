'use client'

import { createClient } from '@/lib/supabase/client'
import { getGradeSheets, type GradeSheet } from '@/lib/onboarding/api'

export interface GradebookSubject {
  name: string
  credits: number
  grade: string
  gradePoints: number
}

export interface GradebookSemester extends GradeSheet {
  subjects: GradebookSubject[]
}

// Builds on getGradeSheets (the same accessor the Dashboard uses) so the base
// semester list/SGPA/credits can never drift between the two screens, then
// enriches each semester with its full subject list from gpa_records.subjects
// — that JSON blob (not the constrained `subjects` table) is the complete
// record, since 0-credit audit courses are excluded from the `subjects` table
// but kept there.
export async function getGradebookSemesters(userId: string): Promise<GradebookSemester[]> {
  const sheets = await getGradeSheets(userId)
  if (sheets.length === 0) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('gpa_records')
    .select('semester_id, subjects')
    .eq('user_id', userId)
  if (error) throw error

  // A semester can in rare legacy cases have more than one gpa_records row
  // (from before saves became idempotent) — last one wins, matching the same
  // defensive dedupe used for the semesters rows themselves.
  const subjectsBySemesterId = new Map<string, GradebookSubject[]>()
  for (const row of data ?? []) {
    if (row.semester_id) subjectsBySemesterId.set(row.semester_id as string, (row.subjects ?? []) as GradebookSubject[])
  }

  return sheets.map(s => ({ ...s, subjects: subjectsBySemesterId.get(s.id) ?? [] }))
}
