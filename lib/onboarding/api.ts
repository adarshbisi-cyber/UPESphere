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
      graduation_year: info.graduationYear,
    })
    .eq('id', userId)
  if (error) throw error
}

export async function saveCurriculumSubjects(
  userId: string,
  subjects: { name: string; credits: number }[]
) {
  if (subjects.length === 0) return
  const supabase = createClient()
  const { error } = await supabase.from('curriculum_subjects').insert(
    subjects.map(s => ({ user_id: userId, name: s.name, credits: s.credits }))
  )
  if (error) throw error
}

export async function saveTimetableSlots(userId: string, slots: TimetableSlot[]) {
  if (slots.length === 0) return
  const supabase = createClient()
  const { error } = await supabase.from('timetable_slots').insert(
    slots.map(s => ({
      user_id: userId,
      day_of_week: s.day,
      start_time: s.startTime,
      end_time: s.endTime,
      subject: s.subject,
      room: s.room,
    }))
  )
  if (error) throw error
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

    const { error: subjectsErr } = await supabase.from('subjects').insert(
      sem.subjects.map((s: ParsedSubjectRow) => ({
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

export async function uploadResume(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${userId}/resume.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('resumes')
    .upload(path, file, { upsert: true })
  if (uploadErr) throw uploadErr

  const { data } = supabase.storage.from('resumes').getPublicUrl(path)
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ resume_file_url: data.publicUrl })
    .eq('id', userId)
  if (updateErr) throw updateErr

  return data.publicUrl
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
