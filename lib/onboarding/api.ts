'use client'

// Data-access layer for the /workspace/setup onboarding flow. Every write is
// scoped to the signed-in user (enforced twice over: RLS policies in
// supabase/onboarding-migration.sql, and explicit user_id filters here).

import { createClient } from '@/lib/supabase/client'
import { GRADE_POINTS_10 } from '@/lib/calculations/gpa'
import type { ParsedSubjectRow } from '@/lib/parsers/gradeCardParser'
import type { TimetableSlot } from '@/lib/parsers/timetableParser'

export interface BasicInfo {
  fullName: string
  university: string
  course: string
  semester: number
  totalSemesters: number
  graduationYear: number | null
}

export async function saveBasicInfo(userId: string, info: BasicInfo) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: info.fullName,
      university: info.university,
      course: info.course,
      current_semester: info.semester,
      total_semesters: info.totalSemesters,
      graduation_year: info.graduationYear,
    })
    .eq('id', userId)
  if (error) throw error
}

// Program length (how many semesters the degree has). Null for accounts that
// onboarded before this field existed — the Degree Progress card falls back
// to a default and lets them set it inline.
export async function getTotalSemesters(userId: string): Promise<number | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('total_semesters')
    .eq('id', userId)
    .single()
  if (error) throw error
  return (data?.total_semesters as number | null) ?? null
}

export async function updateTotalSemesters(userId: string, total: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ total_semesters: total })
    .eq('id', userId)
  if (error) throw error
}

export async function updateCurrentSemester(userId: string, semester: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ current_semester: semester })
    .eq('id', userId)
  if (error) throw error
}

// Re-saving replaces that semester's previous curriculum outright
// (delete-then-insert scoped to semesterNumber) rather than appending — both
// because a re-upload from onboarding retries shouldn't leave duplicate rows
// behind, and because "Update curriculum" from the Dashboard means replace,
// not append. Scoped by semester (not the whole table) so uploading one
// semester's courses never wipes out another semester's already-saved list.
export async function saveCurriculumSubjects(
  userId: string,
  semesterNumber: number,
  subjects: { name: string; credits: number }[]
) {
  const supabase = createClient()
  const { error: deleteErr } = await supabase
    .from('curriculum_subjects')
    .delete()
    .eq('user_id', userId)
    .eq('semester_number', semesterNumber)
  if (deleteErr) throw deleteErr
  if (subjects.length === 0) return
  const { error } = await supabase.from('curriculum_subjects').insert(
    subjects.map(s => ({ user_id: userId, semester_number: semesterNumber, name: s.name, credits: s.credits }))
  )
  if (error) throw error
}

export interface CurriculumSubject {
  id: string
  name: string
  credits: number
}

export interface CurrentSemesterCurriculum {
  semesterNumber: number
  subjects: CurriculumSubject[]
  // Distinguishes "never uploaded any curriculum" from "uploaded, but not
  // for this semester" — the Dashboard needs different empty-state copy for
  // each (see components/dashboard/MyCourses.tsx).
  hasAnyCurriculumUploaded: boolean
}

// The current semester's course list for the Dashboard's "My Courses" widget.
// `profiles.current_semester` is the single source of truth for "which
// semester" (set during onboarding, defaults to 1 — never null in practice),
// so this never falls back to counting grade sheets or curriculum rows.
export async function getCurrentSemesterCurriculum(userId: string): Promise<CurrentSemesterCurriculum> {
  const supabase = createClient()

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('current_semester')
    .eq('id', userId)
    .single()
  if (profileErr) throw profileErr
  const semesterNumber = (profile?.current_semester as number | null) ?? 1

  const [subjectsRes, countRes] = await Promise.all([
    supabase
      .from('curriculum_subjects')
      .select('id, name, credits')
      .eq('user_id', userId)
      .eq('semester_number', semesterNumber)
      .order('created_at', { ascending: true }),
    supabase
      .from('curriculum_subjects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])
  if (subjectsRes.error) throw subjectsRes.error
  if (countRes.error) throw countRes.error

  return {
    semesterNumber,
    subjects: (subjectsRes.data ?? []).map(r => ({
      id: r.id as string,
      name: r.name as string,
      credits: r.credits as number,
    })),
    hasAnyCurriculumUploaded: (countRes.count ?? 0) > 0,
  }
}

export interface CurriculumSemesterGroup {
  semesterNumber: number
  subjects: CurriculumSubject[]
}

// Every saved semester's curriculum, for the "Full Curriculum" browse view —
// distinct from getCurrentSemesterCurriculum, which only returns the one
// semester the Dashboard widget cares about.
export async function getAllCurriculumSubjects(userId: string): Promise<CurriculumSemesterGroup[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('curriculum_subjects')
    .select('id, name, credits, semester_number')
    .eq('user_id', userId)
    .order('semester_number', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error

  const groups = new Map<number, CurriculumSubject[]>()
  for (const r of data ?? []) {
    const sem = (r.semester_number as number | null) ?? 1
    const list = groups.get(sem) ?? []
    list.push({ id: r.id as string, name: r.name as string, credits: r.credits as number })
    groups.set(sem, list)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([semesterNumber, subjects]) => ({ semesterNumber, subjects }))
}

// Removes one semester's saved curriculum outright — for cleaning up a
// semester that was never real (e.g. stale data from before curriculum was
// semester-scoped) rather than replacing it with different courses.
export async function deleteCurriculumSemester(userId: string, semesterNumber: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('curriculum_subjects')
    .delete()
    .eq('user_id', userId)
    .eq('semester_number', semesterNumber)
  if (error) throw error
}

export interface TimetableVersion {
  id: string
  version: number
  effectiveFrom: string // 'YYYY-MM-DD'
}

// Every timetable upload becomes a new version tagged with when it takes
// effect, rather than overwriting the last one — old schedules stay around
// for history, and a change can be scheduled ("starts next Monday") instead
// of always applying immediately.
export async function saveTimetableVersion(
  userId: string,
  slots: TimetableSlot[],
  effectiveFrom: Date
) {
  const supabase = createClient()
  const { data: existing, error: fetchErr } = await supabase
    .from('timetable_versions')
    .select('version')
    .eq('user_id', userId)
    .order('version', { ascending: false })
    .limit(1)
  if (fetchErr) throw fetchErr
  const nextVersion = (existing?.[0]?.version ?? 0) + 1

  const { data: versionRow, error: versionErr } = await supabase
    .from('timetable_versions')
    .insert({ user_id: userId, version: nextVersion, effective_from: effectiveFrom.toISOString().slice(0, 10) })
    .select('id')
    .single()
  if (versionErr) throw versionErr

  if (slots.length === 0) return
  const { error } = await supabase.from('timetable_slots').insert(
    slots.map(s => ({
      user_id: userId,
      version_id: versionRow.id,
      day_of_week: s.day,
      start_time: s.startTime,
      end_time: s.endTime,
      subject: s.subject,
      room: s.room,
    }))
  )
  if (error) throw error
}

export async function getTimetableVersions(userId: string): Promise<TimetableVersion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('timetable_versions')
    .select('id, version, effective_from')
    .eq('user_id', userId)
    // Secondary sort by version breaks ties deterministically when two
    // versions share the same effective_from (e.g. a migration backfill and
    // a same-day re-upload both landing on "today") — the higher version
    // number (the more recently created one) always wins the tie.
    .order('effective_from', { ascending: true })
    .order('version', { ascending: true })
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, version: r.version, effectiveFrom: r.effective_from as string }))
}

// The version currently in effect: the most recent one whose effective_from
// is today or earlier. If every version is still in the future, there's no
// active timetable yet (an upcoming one is scheduled but hasn't started).
export async function getActiveTimetable(
  userId: string
): Promise<{ version: TimetableVersion; slots: TimetableSlot[] } | null> {
  const versions = await getTimetableVersions(userId)
  const todayStr = new Date().toISOString().slice(0, 10)
  const active = [...versions].reverse().find(v => v.effectiveFrom <= todayStr)
  if (!active) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('day_of_week, start_time, end_time, subject, room')
    .eq('version_id', active.id)
  if (error) throw error

  // Defensive dedup: a retried save (double-click, or a retry after a
  // transient error) can leave more than one identical row for the same
  // class within a single version — never show the same slot twice.
  const seen = new Set<string>()
  const slots: TimetableSlot[] = []
  for (const r of data ?? []) {
    const key = `${r.day_of_week}|${r.start_time}|${r.end_time}|${r.subject}`
    if (seen.has(key)) continue
    seen.add(key)
    slots.push({
      day: r.day_of_week as string,
      date: null,
      startTime: r.start_time as string,
      endTime: r.end_time as string,
      subject: r.subject as string,
      room: r.room as string | null,
    })
  }
  return { version: active, slots }
}

export interface GradeCardSemesterInput {
  semesterLabel: string | null
  subjects: ParsedSubjectRow[]
  totalCredits: number | null
  sgpa: number | null
}

/**
 * Imports parsed grade-card semesters into the existing semesters /
 * gpa_records / subjects tables — the same shape the GPA & CGPA calculators
 * already read from, so imported data shows up there immediately.
 */
export async function saveGradeCardSemesters(userId: string, semesters: GradeCardSemesterInput[]) {
  const supabase = createClient()

  for (let i = 0; i < semesters.length; i++) {
    const sem = semesters[i]
    if (sem.subjects.length === 0 || sem.sgpa === null || sem.totalCredits === null) continue

    const semesterNumberMatch = sem.semesterLabel?.match(/(\d+)/)
    const semesterNumber = semesterNumberMatch ? parseInt(semesterNumberMatch[1], 10) : i + 1

    // Re-uploading the same semester (onboarding retry, or "Update" from the
    // Dashboard) replaces it — delete any existing semester row with this
    // number first. gpa_records/subjects cascade away with it.
    const { error: deleteErr } = await supabase
      .from('semesters')
      .delete()
      .eq('user_id', userId)
      .eq('semester_number', semesterNumber)
    if (deleteErr) throw deleteErr

    const { data: semesterRow, error: semesterErr } = await supabase
      .from('semesters')
      .insert({
        user_id: userId,
        name: sem.semesterLabel ?? `Semester ${semesterNumber}`,
        semester_number: semesterNumber,
        sgpa: sem.sgpa,
        total_credits: sem.totalCredits,
      })
      .select('id')
      .single()
    if (semesterErr) throw semesterErr

    const subjectsJson = sem.subjects.map((s: ParsedSubjectRow) => ({
      name: s.name,
      credits: s.credits,
      grade: s.grade,
      gradePoints: GRADE_POINTS_10[s.grade] ?? 0,
    }))

    const { data: gpaRecord, error: gpaErr } = await supabase
      .from('gpa_records')
      .insert({
        user_id: userId,
        semester_id: semesterRow.id,
        subjects: subjectsJson,
        scale: '10',
        sgpa: sem.sgpa,
        total_credits: sem.totalCredits,
        label: sem.semesterLabel,
      })
      .select('id')
      .single()
    if (gpaErr) throw gpaErr

    // public.subjects has a `check (credits > 0)` constraint, but grade cards
    // often list 0-credit entries (audit courses, NSS, induction programs).
    // Those stay in gpa_records.subjects (no such constraint) but are excluded
    // here — otherwise one 0-credit row fails the whole batch insert.
    const creditedSubjects = sem.subjects.filter((s: ParsedSubjectRow) => s.credits > 0)
    if (creditedSubjects.length > 0) {
      const { error: subjectsErr } = await supabase.from('subjects').insert(
        creditedSubjects.map((s: ParsedSubjectRow) => ({
          user_id: userId,
          gpa_record_id: gpaRecord.id,
          semester_id: semesterRow.id,
          name: s.name,
          credits: s.credits,
          grade: s.grade,
          grade_points: GRADE_POINTS_10[s.grade] ?? 0,
        }))
      )
      if (subjectsErr) throw subjectsErr
    }
  }
}

export async function uploadResume(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${userId}/resume.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('resumes')
    .upload(path, file, { upsert: true })
  if (uploadErr) throw uploadErr

  // The "resumes" bucket is private, so we store the storage path (not a
  // public URL, which wouldn't resolve) — generate a signed URL on demand
  // whenever the resume actually needs to be viewed or downloaded.
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ resume_file_url: path })
    .eq('id', userId)
  if (updateErr) throw updateErr

  return path
}

export async function getResumeSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(path, 60 * 60)
  if (error) return null
  return data.signedUrl
}

// Which semester numbers already have a saved grade sheet — lets the
// "Add Semester" modal warn before a pick silently replaces existing data.
export async function getUsedSemesterNumbers(userId: string): Promise<number[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('semesters')
    .select('semester_number')
    .eq('user_id', userId)
  if (error) throw error
  return Array.from(new Set((data ?? []).map(r => r.semester_number as number))).sort((a, b) => a - b)
}

export interface WorkspaceStatus {
  profile: boolean
  curriculum: boolean
  timetable: boolean
  gradeCard: boolean
  resume: boolean
}

export async function getWorkspaceStatus(userId: string): Promise<WorkspaceStatus> {
  const supabase = createClient()

  const [profileRes, curriculumRes, timetableRes, semestersRes] = await Promise.all([
    supabase.from('profiles').select('university, course, resume_file_url').eq('id', userId).single(),
    supabase.from('curriculum_subjects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('timetable_slots').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('semesters').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  return {
    profile: !!(profileRes.data?.university && profileRes.data?.course),
    curriculum: (curriculumRes.count ?? 0) > 0,
    timetable: (timetableRes.count ?? 0) > 0,
    gradeCard: (semestersRes.count ?? 0) > 0,
    resume: !!profileRes.data?.resume_file_url,
  }
}

// Richer per-item status for the dashboard's Academic Workspace cards: whether
// each document exists, when it was last updated, and a count (semesters for
// grade sheets). getWorkspaceStatus stays the lean boolean version used by the
// onboarding-completion math.
export interface WorkspaceItemDetail {
  done: boolean
  lastUpdated: string | null
  count: number
}
export interface WorkspaceDetails {
  profile: WorkspaceItemDetail
  curriculum: WorkspaceItemDetail
  timetable: WorkspaceItemDetail
  gradeCard: WorkspaceItemDetail
  resume: WorkspaceItemDetail
}

export async function getWorkspaceDetails(userId: string): Promise<WorkspaceDetails> {
  const supabase = createClient()

  const [profileRes, curriculumRes, timetableRes, semestersRes] = await Promise.all([
    supabase.from('profiles').select('university, course, resume_file_url, updated_at').eq('id', userId).single(),
    // count: 'exact' returns the full match count regardless of the limit, so
    // one query yields both "how many" and "the most recent one".
    supabase.from('curriculum_subjects').select('created_at', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    supabase.from('timetable_slots').select('created_at', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    supabase.from('semesters').select('updated_at, created_at', { count: 'exact' }).eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
  ])

  const profile = profileRes.data
  const semRow = semestersRes.data?.[0] as { updated_at?: string; created_at?: string } | undefined
  return {
    profile: { done: !!(profile?.university && profile?.course), lastUpdated: profile?.updated_at ?? null, count: 0 },
    curriculum: { done: (curriculumRes.count ?? 0) > 0, lastUpdated: curriculumRes.data?.[0]?.created_at ?? null, count: curriculumRes.count ?? 0 },
    timetable: { done: (timetableRes.count ?? 0) > 0, lastUpdated: timetableRes.data?.[0]?.created_at ?? null, count: timetableRes.count ?? 0 },
    gradeCard: { done: (semestersRes.count ?? 0) > 0, lastUpdated: semRow?.updated_at ?? semRow?.created_at ?? null, count: semestersRes.count ?? 0 },
    resume: { done: !!profile?.resume_file_url, lastUpdated: null, count: profile?.resume_file_url ? 1 : 0 },
  }
}

export interface StoredBasicInfo {
  fullName: string
  university: string
  course: string
  semester: number
  totalSemesters: number
  graduationYear: number | null
}

export async function getBasicInfo(userId: string): Promise<StoredBasicInfo> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, university, course, current_semester, total_semesters, graduation_year')
    .eq('id', userId)
    .single()
  if (error) throw error
  return {
    fullName: data?.full_name ?? '',
    university: data?.university ?? '',
    course: data?.course ?? '',
    semester: data?.current_semester ?? 1,
    totalSemesters: data?.total_semesters ?? 8,
    graduationYear: data?.graduation_year ?? null,
  }
}

export interface GradeSheet {
  id: string
  semesterNumber: number
  name: string
  sgpa: number | null
  totalCredits: number | null
  createdAt: string
}

// The single accessor for a user's saved semesters — the Dashboard and the
// Gradebook both call this, so "Latest SGPA"/"CGPA"/"Credits Earned" can
// never drift between the two screens. Dedupes defensively by
// semester_number (matches the idempotent delete-then-insert save in
// saveGradeCardSemesters, which prevents new duplicates but doesn't retroactively
// clean up any that predate that fix).
export async function getGradeSheets(userId: string): Promise<GradeSheet[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('semesters')
    .select('id, semester_number, name, sgpa, total_credits, created_at')
    .eq('user_id', userId)
    .order('semester_number', { ascending: true })
  if (error) throw error
  const rows = (data ?? []).map(r => ({
    id: r.id as string,
    semesterNumber: r.semester_number as number,
    name: r.name as string,
    sgpa: r.sgpa as number | null,
    totalCredits: r.total_credits as number | null,
    createdAt: r.created_at as string,
  }))
  return Array.from(new Map(rows.map(r => [r.semesterNumber, r])).values())
}

// Deletes one semester's grade sheet. gpa_records and subjects rows cascade
// away with it (foreign keys are ON DELETE CASCADE).
export async function deleteGradeSheet(userId: string, semesterId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('semesters')
    .delete()
    .eq('user_id', userId)
    .eq('id', semesterId)
  if (error) throw error
}

export function workspaceCompletionPct(status: WorkspaceStatus): number {
  const flags = Object.values(status)
  const done = flags.filter(Boolean).length
  return Math.round((done / flags.length) * 100)
}

export async function markOnboardingComplete(userId: string) {
  const supabase = createClient()
  const status = await getWorkspaceStatus(userId)
  const pct = workspaceCompletionPct(status)
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true, workspace_completion: pct })
    .eq('id', userId)
  if (error) throw error
}
