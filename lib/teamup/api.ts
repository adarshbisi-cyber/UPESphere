'use client'

// Data-access layer for TeamUp. Every write is scoped to the signed-in user
// (enforced twice over: RLS policies in supabase/teamup-migration.sql, and
// explicit user_id filters here) — mirrors lib/onboarding/api.ts's convention.
//
// Filtering/search is done client-side (see filterTeams/filterStudents) —
// the feed is fetched once and filters apply instantly against that array,
// rather than round-tripping to Supabase per filter change.

import { createClient } from '@/lib/supabase/client'

type SupabaseClient = ReturnType<typeof createClient>

// ============================================================
// Types
// ============================================================

export interface CompetitionType {
  id: string
  name: string
  slug: string
}

export type SkillCategory = 'business' | 'technology' | 'analytics' | 'product_design' | 'communication'

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  isCustom: boolean
}

export type ExperienceLevel = 'Beginner' | 'Some Experience' | 'Experienced'
export type ExperiencePreference = 'Beginner Friendly' | 'Some Experience Preferred' | 'Experienced Participants Preferred'
export type TeamStatus = 'open' | 'full' | 'closed' | 'cancelled'
export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface PublicProfile {
  id: string
  fullName: string | null
  avatarUrl: string | null
  universityId: string | null
}

export interface Team {
  id: string
  createdBy: string
  competitionName: string
  competitionTypeId: string
  competitionTypeName: string
  competitionPlatform: string | null
  competitionUrl: string | null
  registrationDeadline: string
  maxMembers: number
  currentMembers: number
  experiencePreference: ExperiencePreference | null
  description: string
  additionalRequirements: string | null
  status: TeamStatus
  createdAt: string
  skills: Skill[]
  creator: PublicProfile | null
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'creator' | 'member'
  joinedAt: string
  profile: PublicProfile | null
  skills: Skill[]
}

export interface TeamJoinRequest {
  id: string
  teamId: string
  applicantId: string
  message: string | null
  status: JoinRequestStatus
  createdAt: string
  applicant?: PublicProfile | null
  applicantSkills?: Skill[]
  team?: { id: string; competitionName: string; status: TeamStatus } | null
}

export interface TeamInvitation {
  id: string
  teamId: string
  invitedUserId: string
  invitedBy: string
  status: InvitationStatus
  createdAt: string
  team?: { id: string; competitionName: string; status: TeamStatus } | null
}

export interface CompetitionProfile {
  userId: string
  lookingForTeam: boolean
  availability: string | null
  experienceLevel: ExperienceLevel | null
  competitionsCompleted: number
  bio: string | null
  shareWhatsappWithTeammates: boolean
  whatsappNumber: string | null
  shareEmailWithTeammates: boolean
}

export interface TeamContact {
  userId: string
  fullName: string | null
  whatsappNumber: string | null
  email: string | null
}

// ============================================================
// Lookups
// ============================================================

export async function getCompetitionTypes(): Promise<CompetitionType[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('competition_types').select('id, name, slug').order('name')
  if (error) throw error
  return data ?? []
}

interface SkillRow {
  id: string
  name: string
  category: SkillCategory
  is_custom: boolean
}

function toSkill(r: SkillRow): Skill {
  return { id: r.id, name: r.name, category: r.category, isCustom: r.is_custom }
}

export async function getSkills(): Promise<Skill[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('skills').select('id, name, category, is_custom').order('name')
  if (error) throw error
  return ((data ?? []) as SkillRow[]).map(toSkill)
}

// Custom skills a student adds via the "+ Other" flow in SkillPicker — a
// normal row in the same `skills` table (is_custom = true), so it's
// immediately selectable by every future user and an admin can later
// "promote" it into the official list by flipping is_custom, with zero
// migration.
export async function createCustomSkill(userId: string, name: string, category: SkillCategory): Promise<Skill> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('skills')
    .insert({ name: name.trim(), category, is_custom: true, created_by: userId })
    .select('id, name, category, is_custom')
    .single()
  if (error) throw error
  return toSkill(data as SkillRow)
}

function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

export interface SkillMatch {
  skill: Skill
  /** true when the normalized name is identical to an existing skill (a literal duplicate, not just similar) */
  exact: boolean
}

// Case-insensitive duplicate/near-duplicate detection scoped to one category —
// backs the "+ Other" custom-skill flow: an exact (normalized) match is
// treated as a straight duplicate, a close-but-not-exact match ("ReactJS" vs
// "React") surfaces as a "Did you mean…?" suggestion instead of silently
// creating a near-duplicate skill.
export function findSimilarSkill(name: string, categorySkills: Skill[]): SkillMatch | null {
  const normalized = normalizeSkillName(name)
  if (!normalized) return null

  let best: SkillMatch | null = null
  let bestDistance = Infinity
  for (const skill of categorySkills) {
    const skillNormalized = normalizeSkillName(skill.name)
    if (skillNormalized === normalized) return { skill, exact: true }

    const distance = levenshtein(normalized, skillNormalized)
    const substringMatch = normalized.length >= 3 && (skillNormalized.includes(normalized) || normalized.includes(skillNormalized))
    const closeEnough = distance <= 2 || substringMatch
    if (closeEnough && distance < bestDistance) {
      best = { skill, exact: false }
      bestDistance = distance
    }
  }
  return best
}

// ============================================================
// Internal helpers
// ============================================================

function toPublicProfile(r: { id: string; full_name: string | null; avatar_url: string | null; university_id: string | null }): PublicProfile {
  return { id: r.id, fullName: r.full_name, avatarUrl: r.avatar_url, universityId: r.university_id }
}

async function fetchPublicProfiles(supabase: SupabaseClient, ids: string[]): Promise<Map<string, PublicProfile>> {
  const map = new Map<string, PublicProfile>()
  if (ids.length === 0) return map
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, full_name, avatar_url, university_id')
    .in('id', Array.from(new Set(ids)))
  if (error) throw error
  for (const r of data ?? []) map.set(r.id, toPublicProfile(r))
  return map
}

async function fetchSkillsForTeams(supabase: SupabaseClient, teamIds: string[]): Promise<Map<string, Skill[]>> {
  const map = new Map<string, Skill[]>()
  if (teamIds.length === 0) return map
  const { data, error } = await supabase
    .from('team_skill_requirements')
    .select('team_id, skills(id, name, category, is_custom)')
    .in('team_id', teamIds)
  if (error) throw error
  for (const r of (data ?? []) as unknown as { team_id: string; skills: SkillRow | null }[]) {
    if (!r.skills) continue
    const list = map.get(r.team_id) ?? []
    list.push(toSkill(r.skills))
    map.set(r.team_id, list)
  }
  return map
}

async function fetchSkillsForUsers(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, Skill[]>> {
  const map = new Map<string, Skill[]>()
  if (userIds.length === 0) return map
  const { data, error } = await supabase
    .from('user_skills')
    .select('user_id, skills(id, name, category, is_custom)')
    .in('user_id', Array.from(new Set(userIds)))
  if (error) throw error
  for (const r of (data ?? []) as unknown as { user_id: string; skills: SkillRow | null }[]) {
    if (!r.skills) continue
    const list = map.get(r.user_id) ?? []
    list.push(toSkill(r.skills))
    map.set(r.user_id, list)
  }
  return map
}

interface TeamRow {
  id: string
  created_by: string
  competition_name: string
  competition_type_id: string
  competition_platform: string | null
  competition_url: string | null
  registration_deadline: string
  max_members: number
  current_members: number
  experience_preference: ExperiencePreference | null
  description: string
  additional_requirements: string | null
  status: TeamStatus
  created_at: string
  competition_types: { name: string } | null
}

const TEAM_SELECT = 'id, created_by, competition_name, competition_type_id, competition_platform, competition_url, ' +
  'registration_deadline, max_members, current_members, experience_preference, description, additional_requirements, ' +
  'status, created_at, competition_types(name)'

function toTeam(r: TeamRow, skillsMap: Map<string, Skill[]>, profilesMap: Map<string, PublicProfile>): Team {
  return {
    id: r.id,
    createdBy: r.created_by,
    competitionName: r.competition_name,
    competitionTypeId: r.competition_type_id,
    competitionTypeName: r.competition_types?.name ?? '',
    competitionPlatform: r.competition_platform,
    competitionUrl: r.competition_url,
    registrationDeadline: r.registration_deadline,
    maxMembers: r.max_members,
    currentMembers: r.current_members,
    experiencePreference: r.experience_preference,
    description: r.description,
    additionalRequirements: r.additional_requirements,
    status: r.status,
    createdAt: r.created_at,
    skills: skillsMap.get(r.id) ?? [],
    creator: profilesMap.get(r.created_by) ?? null,
  }
}

async function hydrateTeams(supabase: SupabaseClient, rows: TeamRow[]): Promise<Team[]> {
  const [skillsMap, profilesMap] = await Promise.all([
    fetchSkillsForTeams(supabase, rows.map(r => r.id)),
    fetchPublicProfiles(supabase, rows.map(r => r.created_by)),
  ])
  return rows.map(r => toTeam(r, skillsMap, profilesMap))
}

// ============================================================
// Teams — feed, detail, create, status
// ============================================================

// Fetches every open, not-yet-expired team once — filtering/search
// happens client-side via filterTeams, so adjusting a filter re-renders
// instantly instead of round-tripping to Supabase.
export async function getActiveTeams(): Promise<Team[]> {
  const supabase = createClient()
  const todayStr = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_SELECT)
    .eq('status', 'open')
    .gte('registration_deadline', todayStr)
    .order('registration_deadline', { ascending: true })
  if (error) throw error
  return hydrateTeams(supabase, (data ?? []) as unknown as TeamRow[])
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('teams').select(TEAM_SELECT).eq('id', teamId).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [team] = await hydrateTeams(supabase, [data as unknown as TeamRow])
  return team
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, role, joined_at')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  const rows = data ?? []
  const [profilesMap, skillsMap] = await Promise.all([
    fetchPublicProfiles(supabase, rows.map(r => r.user_id)),
    fetchSkillsForUsers(supabase, rows.map(r => r.user_id)),
  ])
  return rows.map(r => ({
    id: r.id, teamId: r.team_id, userId: r.user_id, role: r.role as 'creator' | 'member',
    joinedAt: r.joined_at, profile: profilesMap.get(r.user_id) ?? null,
    skills: skillsMap.get(r.user_id) ?? [],
  }))
}

export interface CreateTeamInput {
  competitionName: string
  competitionTypeId: string
  competitionPlatform?: string
  competitionUrl?: string
  registrationDeadline: string // 'YYYY-MM-DD'
  maxMembers: number
  currentMembers: number
  experiencePreference?: ExperiencePreference
  description: string
  additionalRequirements?: string
  skillIds: string[]
}

export async function createTeam(userId: string, input: CreateTeamInput): Promise<string> {
  const supabase = createClient()
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      created_by: userId,
      competition_name: input.competitionName,
      competition_type_id: input.competitionTypeId,
      competition_platform: input.competitionPlatform || null,
      competition_url: input.competitionUrl || null,
      registration_deadline: input.registrationDeadline,
      max_members: input.maxMembers,
      current_members: input.currentMembers,
      experience_preference: input.experiencePreference || null,
      description: input.description,
      additional_requirements: input.additionalRequirements || null,
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: memberErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: userId, role: 'creator' })
  if (memberErr) throw memberErr

  if (input.skillIds.length > 0) {
    const { error: skillErr } = await supabase
      .from('team_skill_requirements')
      .insert(input.skillIds.map(skill_id => ({ team_id: team.id, skill_id })))
    if (skillErr) throw skillErr
  }

  return team.id as string
}

export async function updateTeamStatus(teamId: string, status: TeamStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('teams').update({ status }).eq('id', teamId)
  if (error) throw error
}

// ============================================================
// Join requests
// ============================================================

export async function requestToJoin(userId: string, teamId: string, message: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('team_join_requests')
    .insert({ team_id: teamId, applicant_id: userId, message: message || null })
  if (error) throw error
}

export async function getMyPendingRequestForTeam(userId: string, teamId: string): Promise<TeamJoinRequest | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('team_join_requests')
    .select('id, team_id, applicant_id, message, status, created_at')
    .eq('team_id', teamId)
    .eq('applicant_id', userId)
    .eq('status', 'pending')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, teamId: data.team_id, applicantId: data.applicant_id, message: data.message, status: data.status as JoinRequestStatus, createdAt: data.created_at }
}

export async function cancelJoinRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('team_join_requests').update({ status: 'cancelled' }).eq('id', requestId)
  if (error) throw error
}

export async function getMyJoinRequests(userId: string): Promise<TeamJoinRequest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('team_join_requests')
    .select('id, team_id, applicant_id, message, status, created_at, teams(id, competition_name, status)')
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r): TeamJoinRequest => {
    const row = r as unknown as { id: string; team_id: string; applicant_id: string; message: string | null; status: string; created_at: string; teams: { id: string; competition_name: string; status: string } | null }
    return {
      id: row.id, teamId: row.team_id, applicantId: row.applicant_id, message: row.message,
      status: row.status as JoinRequestStatus, createdAt: row.created_at,
      team: row.teams ? { id: row.teams.id, competitionName: row.teams.competition_name, status: row.teams.status as TeamStatus } : null,
    }
  })
}

export async function getTeamJoinRequests(teamId: string): Promise<TeamJoinRequest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('team_join_requests')
    .select('id, team_id, applicant_id, message, status, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const rows = data ?? []
  const applicantIds = rows.map(r => r.applicant_id)
  const [profilesMap, skillsByUser] = await Promise.all([
    fetchPublicProfiles(supabase, applicantIds),
    fetchSkillsForUsers(supabase, applicantIds),
  ])
  return rows.map(r => ({
    id: r.id, teamId: r.team_id, applicantId: r.applicant_id, message: r.message,
    status: r.status as JoinRequestStatus, createdAt: r.created_at,
    applicant: profilesMap.get(r.applicant_id) ?? null,
    applicantSkills: skillsByUser.get(r.applicant_id) ?? [],
  }))
}

export async function acceptJoinRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('accept_join_request', { p_request_id: requestId })
  if (error) throw error
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('reject_join_request', { p_request_id: requestId })
  if (error) throw error
}

// Creator-only — enforced server-side (security definer RPC; team_members
// has no DELETE RLS policy at all, so this is the only path that can ever
// remove a row). Decrements capacity and reopens recruitment if the team
// was full, and notifies the removed user.
export async function removeMember(teamId: string, targetUserId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('remove_team_member', { p_team_id: teamId, p_target_user_id: targetUserId })
  if (error) throw error
}

// ============================================================
// My teams
// ============================================================

export async function getMyTeams(userId: string): Promise<Team[]> {
  const supabase = createClient()
  const { data: memberRows, error: memberErr } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
  if (memberErr) throw memberErr
  const teamIds = Array.from(new Set((memberRows ?? []).map(r => r.team_id)))
  if (teamIds.length === 0) return []

  const { data, error } = await supabase.from('teams').select(TEAM_SELECT).in('id', teamIds).order('created_at', { ascending: false })
  if (error) throw error
  return hydrateTeams(supabase, (data ?? []) as unknown as TeamRow[])
}

// ============================================================
// Competition profile / skills / interests
// ============================================================

export async function getCompetitionProfile(userId: string): Promise<CompetitionProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('competition_profiles')
    .select('user_id, looking_for_team, availability, experience_level, competitions_completed, bio, share_whatsapp_with_teammates, whatsapp_number, share_email_with_teammates')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    userId: data.user_id, lookingForTeam: data.looking_for_team, availability: data.availability,
    experienceLevel: data.experience_level as ExperienceLevel | null, competitionsCompleted: data.competitions_completed, bio: data.bio,
    shareWhatsappWithTeammates: data.share_whatsapp_with_teammates, whatsappNumber: data.whatsapp_number,
    shareEmailWithTeammates: data.share_email_with_teammates,
  }
}

export interface CompetitionProfileInput {
  lookingForTeam: boolean
  availability?: string
  experienceLevel?: ExperienceLevel
  competitionsCompleted?: number
  bio?: string
  shareWhatsappWithTeammates?: boolean
  whatsappNumber?: string
  shareEmailWithTeammates?: boolean
}

export async function upsertCompetitionProfile(userId: string, input: CompetitionProfileInput): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('competition_profiles').upsert({
    user_id: userId,
    looking_for_team: input.lookingForTeam,
    availability: input.availability || null,
    experience_level: input.experienceLevel || null,
    competitions_completed: input.competitionsCompleted ?? 0,
    bio: input.bio || null,
    share_whatsapp_with_teammates: input.shareWhatsappWithTeammates ?? false,
    whatsapp_number: input.whatsappNumber || null,
    share_email_with_teammates: input.shareEmailWithTeammates ?? false,
  })
  if (error) throw error
}

export async function setLookingForTeam(userId: string, active: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('competition_profiles')
    .upsert({ user_id: userId, looking_for_team: active }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function getUserSkills(userId: string): Promise<Skill[]> {
  const supabase = createClient()
  const map = await fetchSkillsForUsers(supabase, [userId])
  return map.get(userId) ?? []
}

// Replace-all — matches this codebase's established pattern for editable
// multi-select associations (delete then insert; see saveCurriculumSubjects).
export async function setUserSkills(userId: string, skillIds: string[]): Promise<void> {
  const supabase = createClient()
  const { error: delErr } = await supabase.from('user_skills').delete().eq('user_id', userId)
  if (delErr) throw delErr
  if (skillIds.length === 0) return
  const { error } = await supabase.from('user_skills').insert(skillIds.map(skill_id => ({ user_id: userId, skill_id })))
  if (error) throw error
}

export async function getUserCompetitionInterests(userId: string): Promise<CompetitionType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_competition_interests')
    .select('competition_types(id, name, slug)')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? [])
    .map(r => (r as unknown as { competition_types: CompetitionType | null }).competition_types)
    .filter((t): t is CompetitionType => t !== null)
}

export async function setUserCompetitionInterests(userId: string, typeIds: string[]): Promise<void> {
  const supabase = createClient()
  const { error: delErr } = await supabase.from('user_competition_interests').delete().eq('user_id', userId)
  if (delErr) throw delErr
  if (typeIds.length === 0) return
  const { error } = await supabase
    .from('user_competition_interests')
    .insert(typeIds.map(competition_type_id => ({ user_id: userId, competition_type_id })))
  if (error) throw error
}

// ============================================================
// Student discovery + invitations
// ============================================================

export interface LookingForTeamStudent {
  profile: PublicProfile
  availability: string | null
  experienceLevel: ExperienceLevel | null
  competitionsCompleted: number
  bio: string | null
  skills: Skill[]
  interests: CompetitionType[]
}

export async function getStudentsLookingForTeam(): Promise<LookingForTeamStudent[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('public_competition_profiles')
    .select('user_id, availability, experience_level, competitions_completed, bio')
  if (error) throw error
  const rows = data ?? []
  const userIds = rows.map(r => r.user_id)

  const [profilesMap, skillsMap, interestRows] = await Promise.all([
    fetchPublicProfiles(supabase, userIds),
    fetchSkillsForUsers(supabase, userIds),
    userIds.length > 0
      ? supabase.from('user_competition_interests').select('user_id, competition_types(id, name, slug)').in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (interestRows.error) throw interestRows.error

  const interestsMap = new Map<string, CompetitionType[]>()
  for (const r of (interestRows.data ?? []) as unknown as { user_id: string; competition_types: CompetitionType | null }[]) {
    if (!r.competition_types) continue
    const list = interestsMap.get(r.user_id) ?? []
    list.push(r.competition_types)
    interestsMap.set(r.user_id, list)
  }

  return rows
    .map(r => {
      const profile = profilesMap.get(r.user_id)
      if (!profile) return null
      return {
        profile,
        availability: r.availability,
        experienceLevel: r.experience_level as ExperienceLevel | null,
        competitionsCompleted: r.competitions_completed,
        bio: r.bio,
        skills: skillsMap.get(r.user_id) ?? [],
        interests: interestsMap.get(r.user_id) ?? [],
      }
    })
    .filter((s): s is LookingForTeamStudent => s !== null)
}

export async function inviteToTeam(teamId: string, invitedUserId: string, invitedBy: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('team_invitations')
    .insert({ team_id: teamId, invited_user_id: invitedUserId, invited_by: invitedBy })
  if (error) throw error
}

export async function getMyInvitations(userId: string): Promise<TeamInvitation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('team_invitations')
    .select('id, team_id, invited_user_id, invited_by, status, created_at, teams(id, competition_name, status)')
    .eq('invited_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r): TeamInvitation => {
    const row = r as unknown as { id: string; team_id: string; invited_user_id: string; invited_by: string; status: string; created_at: string; teams: { id: string; competition_name: string; status: string } | null }
    return {
      id: row.id, teamId: row.team_id, invitedUserId: row.invited_user_id, invitedBy: row.invited_by,
      status: row.status as InvitationStatus, createdAt: row.created_at,
      team: row.teams ? { id: row.teams.id, competitionName: row.teams.competition_name, status: row.teams.status as TeamStatus } : null,
    }
  })
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('accept_team_invitation', { p_invitation_id: invitationId })
  if (error) throw error
}

export async function declineInvitation(invitationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('team_invitations').update({ status: 'declined' }).eq('id', invitationId)
  if (error) throw error
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('team_invitations').update({ status: 'cancelled' }).eq('id', invitationId)
  if (error) throw error
}

export async function getTeamContacts(teamId: string): Promise<TeamContact[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_team_contacts', { p_team_id: teamId })
  if (error) throw error
  return (data ?? []).map((r: { user_id: string; full_name: string | null; whatsapp_number: string | null; email: string | null }) => ({
    userId: r.user_id, fullName: r.full_name, whatsappNumber: r.whatsapp_number, email: r.email,
  }))
}

// ============================================================
// Deadline / urgency
// ============================================================

export interface DeadlineStatus {
  label: string
  urgent: boolean // <=3 days — drives a warmer badge treatment
  expired: boolean
}

function daysUntil(deadline: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const days = daysUntil(deadline)
  if (days < 0) return { label: 'Registration closed', urgent: false, expired: true }
  if (days === 0) return { label: 'Closes today', urgent: true, expired: false }
  if (days === 1) return { label: 'Closes tomorrow', urgent: true, expired: false }
  if (days <= 3) return { label: `${days} days remaining`, urgent: true, expired: false }
  return { label: `${days} days remaining`, urgent: false, expired: false }
}

// ============================================================
// Team relationship — single source of truth for "what should the
// Request-to-Join action look like for this user on this team", used by
// both the feed (TeamCard) and the team detail page so the two surfaces can
// never drift into showing different things for the same underlying state.
// Deliberately takes booleans rather than fetching anything itself — the
// caller decides how to source isMember/hasPendingRequest (single-team query
// on the detail page, bulk query on the feed) to avoid an N+1 query pattern.
// ============================================================

export type TeamRelationship = 'creator' | 'member' | 'pending' | 'unavailable' | 'eligible'

export function getTeamRelationship({
  team, isCreator, isMember, hasPendingRequest,
}: {
  team: Team
  isCreator: boolean
  isMember: boolean
  hasPendingRequest: boolean
}): TeamRelationship {
  if (isCreator) return 'creator'
  if (isMember) return 'member'
  if (hasPendingRequest) return 'pending'
  if (team.status !== 'open') return 'unavailable'
  if (team.currentMembers >= team.maxMembers) return 'unavailable'
  if (getDeadlineStatus(team.registrationDeadline).expired) return 'unavailable'
  return 'eligible'
}

// Bulk variants of the single-team membership/pending-request checks, used
// by the feed to compute every visible team's relationship in two queries
// total instead of one pair of queries per card.
export async function getMyMembershipTeamIds(userId: string, teamIds: string[]): Promise<Set<string>> {
  const supabase = createClient()
  if (teamIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .in('team_id', teamIds)
  if (error) throw error
  return new Set((data ?? []).map(r => r.team_id))
}

export async function getMyPendingRequestTeamIds(userId: string, teamIds: string[]): Promise<Set<string>> {
  const supabase = createClient()
  if (teamIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('team_join_requests')
    .select('team_id')
    .eq('applicant_id', userId)
    .eq('status', 'pending')
    .in('team_id', teamIds)
  if (error) throw error
  return new Set((data ?? []).map(r => r.team_id))
}

// ============================================================
// Client-side filtering (feed fetched once, filtered instantly)
// ============================================================

export interface TeamFilters {
  competitionTypeId?: string
  skillIds?: string[]
  deadlineWithinDays?: 1 | 3 | 7
  minSlotsNeeded?: 1 | 2
  search?: string
}

export function filterTeams(teams: Team[], filters: TeamFilters): Team[] {
  const q = filters.search?.trim().toLowerCase()
  return teams.filter(t => {
    if (filters.competitionTypeId && t.competitionTypeId !== filters.competitionTypeId) return false
    if (filters.skillIds && filters.skillIds.length > 0 && !t.skills.some(s => filters.skillIds!.includes(s.id))) return false
    if (filters.deadlineWithinDays && daysUntil(t.registrationDeadline) > filters.deadlineWithinDays) return false
    if (filters.minSlotsNeeded && (t.maxMembers - t.currentMembers) < filters.minSlotsNeeded) return false
    if (q) {
      const haystack = [t.competitionName, t.description, ...t.skills.map(s => s.name)].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

// Competition URL is user-entered and rendered as a clickable link — a
// non-http(s) scheme (e.g. `javascript:`) would be a stored-XSS vector if
// rendered as-is. Checked both at form-submission time and again at render
// time as defense in depth.
export function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export interface StudentFilters {
  competitionTypeId?: string
  skillIds?: string[]
}

export function filterStudents(students: LookingForTeamStudent[], filters: StudentFilters): LookingForTeamStudent[] {
  return students.filter(s => {
    if (filters.competitionTypeId && !s.interests.some(i => i.id === filters.competitionTypeId)) return false
    if (filters.skillIds && filters.skillIds.length > 0 && !s.skills.some(sk => filters.skillIds!.includes(sk.id))) return false
    return true
  })
}
