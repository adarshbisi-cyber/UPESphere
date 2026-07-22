import { describe, expect, it } from 'vitest'
import {
  getDeadlineStatus, isSafeHttpUrl, filterTeams, filterStudents, findSimilarSkill, getTeamRelationship,
  type Team, type LookingForTeamStudent, type Skill,
} from '@/lib/teamup/api'

// Builds the date string from local getters throughout (not toISOString,
// which serializes in UTC) — getDeadlineStatus itself compares against local
// midnight, so mixing in a UTC-serialized string here caused this helper to
// silently return "yesterday" for any timezone/time-of-day where the local
// calendar date and UTC calendar date briefly disagree (e.g. IST, 00:00-05:29).
function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 't1', createdBy: 'u1', competitionName: 'Sparkathon', competitionTypeId: 'type-hack',
    competitionTypeName: 'Hackathon', competitionPlatform: 'Unstop', competitionUrl: null,
    registrationDeadline: daysFromNow(5), maxMembers: 4, currentMembers: 2,
    experiencePreference: null, description: 'Building a retail AI tool', additionalRequirements: null,
    status: 'open', createdAt: new Date().toISOString(),
    skills: [{ id: 's1', name: 'React', category: 'technology', isCustom: false }],
    creator: null,
    ...overrides,
  }
}

function makeStudent(overrides: Partial<LookingForTeamStudent> = {}): LookingForTeamStudent {
  return {
    profile: { id: 'u1', fullName: 'Asha', avatarUrl: null, universityId: null },
    availability: 'Weekends', experienceLevel: 'Some Experience', competitionsCompleted: 2,
    bio: null,
    skills: [{ id: 's1', name: 'React', category: 'technology', isCustom: false }],
    interests: [{ id: 'type-hack', name: 'Hackathon', slug: 'hackathon' }],
    ...overrides,
  }
}

describe('getDeadlineStatus', () => {
  it('shows days remaining for a deadline more than 3 days out', () => {
    const status = getDeadlineStatus(daysFromNow(7))
    expect(status).toEqual({ label: '7 days remaining', urgent: false, expired: false })
  })

  it('marks a deadline within 3 days as urgent', () => {
    const status = getDeadlineStatus(daysFromNow(2))
    expect(status.label).toBe('2 days remaining')
    expect(status.urgent).toBe(true)
    expect(status.expired).toBe(false)
  })

  it('labels a same-day deadline "Closes today"', () => {
    expect(getDeadlineStatus(daysFromNow(0))).toEqual({ label: 'Closes today', urgent: true, expired: false })
  })

  it('labels a next-day deadline "Closes tomorrow"', () => {
    expect(getDeadlineStatus(daysFromNow(1))).toEqual({ label: 'Closes tomorrow', urgent: true, expired: false })
  })

  it('marks a past deadline as expired with "Registration closed"', () => {
    expect(getDeadlineStatus(daysFromNow(-1))).toEqual({ label: 'Registration closed', urgent: false, expired: true })
  })
})

describe('isSafeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isSafeHttpUrl('https://unstop.com/hack')).toBe(true)
    expect(isSafeHttpUrl('http://example.com')).toBe(true)
  })

  it('rejects a javascript: URL', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isSafeHttpUrl('not a url')).toBe(false)
  })
})

describe('filterTeams', () => {
  const teams = [
    makeTeam({ id: 't1', competitionName: 'Sparkathon', competitionTypeId: 'type-hack' }),
    makeTeam({
      id: 't2', competitionName: 'Case Comp Finals', competitionTypeId: 'type-case',
      skills: [{ id: 's2', name: 'Financial Modelling', category: 'business', isCustom: false }],
      maxMembers: 5, currentMembers: 4, registrationDeadline: daysFromNow(1),
      description: 'Need a finance lead',
    }),
  ]

  it('returns everything when no filters are set', () => {
    expect(filterTeams(teams, {})).toHaveLength(2)
  })

  it('filters by competition type', () => {
    const result = filterTeams(teams, { competitionTypeId: 'type-case' })
    expect(result.map(t => t.id)).toEqual(['t2'])
  })

  it('filters by required skill', () => {
    const result = filterTeams(teams, { skillIds: ['s2'] })
    expect(result.map(t => t.id)).toEqual(['t2'])
  })

  it('filters by deadline window', () => {
    const result = filterTeams(teams, { deadlineWithinDays: 3 })
    expect(result.map(t => t.id)).toEqual(['t2'])
  })

  it('filters by minimum open slots', () => {
    // t1 has 4-2=2 open slots, t2 has 5-4=1 open slot
    const result = filterTeams(teams, { minSlotsNeeded: 2 })
    expect(result.map(t => t.id)).toEqual(['t1'])
  })

  it('searches across name, description, and skill names, case-insensitively', () => {
    expect(filterTeams(teams, { search: 'finance' }).map(t => t.id)).toEqual(['t2'])
    expect(filterTeams(teams, { search: 'SPARKATHON' }).map(t => t.id)).toEqual(['t1'])
  })
})

describe('filterStudents', () => {
  const students = [
    makeStudent({ profile: { id: 'u1', fullName: 'Asha', avatarUrl: null, universityId: null } }),
    makeStudent({
      profile: { id: 'u2', fullName: 'Rohan', avatarUrl: null, universityId: null },
      interests: [{ id: 'type-case', name: 'Case Comp', slug: 'case-comp' }],
      skills: [{ id: 's2', name: 'Financial Modelling', category: 'business', isCustom: false }],
    }),
  ]

  it('returns everyone when no filters are set', () => {
    expect(filterStudents(students, {})).toHaveLength(2)
  })

  it('filters by competition interest', () => {
    const result = filterStudents(students, { competitionTypeId: 'type-case' })
    expect(result.map(s => s.profile.id)).toEqual(['u2'])
  })

  it('filters by skill', () => {
    const result = filterStudents(students, { skillIds: ['s1'] })
    expect(result.map(s => s.profile.id)).toEqual(['u1'])
  })
})

describe('findSimilarSkill', () => {
  const categorySkills: Skill[] = [
    { id: 's1', name: 'React', category: 'technology', isCustom: false },
    { id: 's2', name: 'Next.js', category: 'technology', isCustom: false },
    { id: 's3', name: 'AI/ML', category: 'technology', isCustom: false },
  ]

  it('returns null when nothing is similar', () => {
    expect(findSimilarSkill('Rust', categorySkills)).toBeNull()
  })

  it('returns null for an empty/whitespace-only name', () => {
    expect(findSimilarSkill('   ', categorySkills)).toBeNull()
  })

  it('treats a case-insensitive exact match as exact, not a suggestion', () => {
    const match = findSimilarSkill('react', categorySkills)
    expect(match).toEqual({ skill: categorySkills[0], exact: true })
  })

  it('treats a punctuation/whitespace-insensitive exact match as exact', () => {
    const match = findSimilarSkill('  NEXT JS  ', categorySkills)
    expect(match).toEqual({ skill: categorySkills[1], exact: true })
  })

  it('suggests a close-but-not-exact match ("ReactJS" -> "React")', () => {
    const match = findSimilarSkill('ReactJS', categorySkills)
    expect(match?.exact).toBe(false)
    expect(match?.skill.name).toBe('React')
  })

  it('does not suggest an unrelated skill in the same category', () => {
    expect(findSimilarSkill('Figma', categorySkills)).toBeNull()
  })
})

describe('getTeamRelationship', () => {
  it('prioritizes creator over every other state', () => {
    const team = makeTeam({ status: 'open', currentMembers: 1, maxMembers: 4 })
    expect(getTeamRelationship({ team, isCreator: true, isMember: true, hasPendingRequest: true })).toBe('creator')
  })

  it('prioritizes member over a pending request', () => {
    const team = makeTeam({ status: 'open' })
    expect(getTeamRelationship({ team, isCreator: false, isMember: true, hasPendingRequest: true })).toBe('member')
  })

  it('shows pending when neither creator nor member', () => {
    const team = makeTeam({ status: 'open' })
    expect(getTeamRelationship({ team, isCreator: false, isMember: false, hasPendingRequest: true })).toBe('pending')
  })

  it('is unavailable when the team is not open (closed/cancelled/full status)', () => {
    const team = makeTeam({ status: 'closed' })
    expect(getTeamRelationship({ team, isCreator: false, isMember: false, hasPendingRequest: false })).toBe('unavailable')
  })

  it('is unavailable when current_members has reached max_members', () => {
    const team = makeTeam({ status: 'open', currentMembers: 4, maxMembers: 4 })
    expect(getTeamRelationship({ team, isCreator: false, isMember: false, hasPendingRequest: false })).toBe('unavailable')
  })

  it('is unavailable when the registration deadline has passed', () => {
    const team = makeTeam({ status: 'open', registrationDeadline: daysFromNow(-1) })
    expect(getTeamRelationship({ team, isCreator: false, isMember: false, hasPendingRequest: false })).toBe('unavailable')
  })

  it('is eligible for a non-member with an open, non-full, non-expired team', () => {
    const team = makeTeam({ status: 'open', currentMembers: 1, maxMembers: 4, registrationDeadline: daysFromNow(5) })
    expect(getTeamRelationship({ team, isCreator: false, isMember: false, hasPendingRequest: false })).toBe('eligible')
  })

  it('a removed member (no longer in team_members) becomes eligible again', () => {
    const team = makeTeam({ status: 'open', currentMembers: 2, maxMembers: 4 })
    // isMember flips false once the row is deleted; no lingering pending request.
    expect(getTeamRelationship({ team, isCreator: false, isMember: false, hasPendingRequest: false })).toBe('eligible')
  })
})
