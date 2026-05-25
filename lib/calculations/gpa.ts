import type { Subject, GPAResult, GradeScale } from '@/types'

export const GRADE_POINTS_10: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
}

export function calculateGPA(subjects: Subject[], scale: GradeScale): GPAResult {
  const validSubjects = subjects.filter(s => s.credits >= 0 && s.grade)

  if (validSubjects.length === 0) {
    return { sgpa: 0, totalCredits: 0, percentageEquivalent: 0, gradePoints: 0, insights: [] }
  }

  let totalWeightedPoints = 0
  let totalCredits = 0
  let failedCount = 0

  for (const subject of validSubjects) {
    const points =
      scale === 'percentage'
        ? subject.gradePoints ?? 0
        : GRADE_POINTS_10[subject.grade] ?? 0

    totalWeightedPoints += points * subject.credits
    totalCredits += subject.credits
    if (subject.grade === 'F') failedCount++
  }

  const sgpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0
  const percentageEquivalent = sgpa >= 0.5 ? (sgpa - 0.5) * 10 : 0
  const insights = generateGPAInsights(sgpa, validSubjects, failedCount)

  return {
    sgpa: Math.round(sgpa * 100) / 100,
    totalCredits,
    percentageEquivalent: Math.round(percentageEquivalent * 10) / 10,
    gradePoints: Math.round(totalWeightedPoints * 100) / 100,
    insights,
  }
}

function generateGPAInsights(
  gpa: number,
  subjects: Subject[],
  failedCount: number
): string[] {
  const insights: string[] = []

  if (failedCount > 0) {
    insights.push(
      `You have ${failedCount} failed subject${failedCount > 1 ? 's' : ''}. These are heavily impacting your GPA.`
    )
  }

  const ratio = gpa / 10
  if (ratio >= 0.9) {
    insights.push("Outstanding! You're in the top academic tier. Keep pushing for perfection.")
  } else if (ratio >= 0.8) {
    insights.push("Great performance! You're well above average. Aim for the distinction band.")
  } else if (ratio >= 0.7) {
    insights.push("Good performance. With a bit more effort you can hit distinction.")
  } else if (ratio >= 0.6) {
    insights.push("Average performance. Focus on improving your core subjects next semester.")
  } else {
    insights.push("Your GPA needs attention. Consider seeking academic support or tutoring.")
  }

  const sorted = [...subjects]
    .filter(s => s.grade !== 'F' && s.credits > 0)
    .sort((a, b) => (GRADE_POINTS_10[a.grade] ?? 0) - (GRADE_POINTS_10[b.grade] ?? 0))

  if (sorted.length > 0) {
    const weakest = sorted[0]
    const subName = weakest.name?.trim() || 'Your weakest subject'
    insights.push(`"${subName}" is pulling your GPA down the most — prioritise it.`)
  }

  return insights
}

export function getGradesForScale(_scale: GradeScale): string[] {
  return Object.keys(GRADE_POINTS_10)
}

export function gradeToPoints(grade: string, _scale: GradeScale): number {
  return GRADE_POINTS_10[grade] ?? 0
}
