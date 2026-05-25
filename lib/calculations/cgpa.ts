import type { Semester, CGPAResult } from '@/types'

export function calculateCGPA(semesters: Semester[]): CGPAResult {
  const valid = semesters.filter(s => s.sgpa > 0 && s.credits > 0)

  if (valid.length === 0) {
    return {
      cgpa: 0,
      totalCredits: 0,
      percentageEquivalent: 0,
      semesterCount: 0,
      trend: 'stable',
      insights: [],
    }
  }

  let totalWeighted = 0
  let totalCredits = 0

  for (const sem of valid) {
    totalWeighted += sem.sgpa * sem.credits
    totalCredits += sem.credits
  }

  const cgpa = totalCredits > 0 ? totalWeighted / totalCredits : 0
  const percentageEquivalent = cgpa >= 0.5 ? (cgpa - 0.5) * 10 : 0

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (valid.length >= 2) {
    const last = valid[valid.length - 1].sgpa
    const prev = valid[valid.length - 2].sgpa
    if (last > prev + 0.1) trend = 'improving'
    else if (last < prev - 0.1) trend = 'declining'
  }

  const insights = generateCGPAInsights(cgpa, valid, trend)

  return {
    cgpa: Math.round(cgpa * 100) / 100,
    totalCredits,
    percentageEquivalent: Math.round(percentageEquivalent * 10) / 10,
    semesterCount: valid.length,
    trend,
    insights,
  }
}

export function predictTargetSGPA(
  currentSemesters: Semester[],
  targetCGPA: number,
  remainingSemesters: number,
  creditsPerSemester: number
): { sgpaNeeded: number; achievable: boolean; message: string } {
  const valid = currentSemesters.filter(s => s.sgpa > 0 && s.credits > 0)

  let currentWeighted = 0
  let currentCredits = 0
  for (const sem of valid) {
    currentWeighted += sem.sgpa * sem.credits
    currentCredits += sem.credits
  }

  const remainingCredits = remainingSemesters * creditsPerSemester
  const totalCredits = currentCredits + remainingCredits
  const requiredTotal = targetCGPA * totalCredits
  const requiredRemaining = requiredTotal - currentWeighted

  if (remainingCredits === 0) {
    const current = currentCredits > 0 ? currentWeighted / currentCredits : 0
    return {
      sgpaNeeded: 0,
      achievable: current >= targetCGPA,
      message: current >= targetCGPA ? 'You already achieved your target!' : 'No remaining semesters to improve.',
    }
  }

  const sgpaNeeded = requiredRemaining / remainingCredits
  const achievable = sgpaNeeded <= 10

  const message = achievable
    ? `You need an average SGPA of ${sgpaNeeded.toFixed(2)} in the remaining ${remainingSemesters} semester${remainingSemesters > 1 ? 's' : ''} to graduate with ${targetCGPA} CGPA.`
    : `Target CGPA of ${targetCGPA} is not achievable — it would require ${sgpaNeeded.toFixed(2)} SGPA which exceeds 10.`

  return {
    sgpaNeeded: Math.round(sgpaNeeded * 100) / 100,
    achievable,
    message,
  }
}

function generateCGPAInsights(cgpa: number, semesters: Semester[], trend: string): string[] {
  const insights: string[] = []

  if (trend === 'improving') {
    insights.push("Your academic performance is on an upward trajectory — keep the momentum!")
  } else if (trend === 'declining') {
    insights.push("Performance dipped last semester. Time to refocus and bounce back.")
  } else {
    insights.push("Consistent performance across semesters. Aim to push the trend upward.")
  }

  if (cgpa >= 9.0) {
    insights.push("Exceptional! You're in distinction territory. Many top companies shortlist at 9+.")
  } else if (cgpa >= 8.0) {
    insights.push("First Class with Distinction. Push to hit 9+ for top-tier placements.")
  } else if (cgpa >= 7.0) {
    insights.push("Good standing. Most companies shortlist at 7.5+ — you're on the right track.")
  } else if (cgpa >= 6.0) {
    insights.push("Average. Focus on improving by at least 0.5 next semester for better opportunities.")
  } else {
    insights.push("Needs significant improvement. Seek academic support and create a study plan now.")
  }

  if (semesters.length >= 2) {
    const best = semesters.reduce((m, s) => (s.sgpa > m.sgpa ? s : m), semesters[0])
    const worst = semesters.reduce((m, s) => (s.sgpa < m.sgpa ? s : m), semesters[0])
    if (best.id !== worst.id) {
      insights.push(
        `Best: ${best.name || 'Semester'} (${best.sgpa}). Worst: ${worst.name || 'Semester'} (${worst.sgpa}). Replicate your best semester.`
      )
    }
  }

  return insights
}
