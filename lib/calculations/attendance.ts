import type { AttendanceResult } from '@/types'

export function calculateAttendance(
  attended: number,
  total: number,
  required: number
): AttendanceResult {
  if (total === 0) {
    return {
      currentPercentage: 0,
      status: 'safe',
      safeBunks: 0,
      classesNeeded: 0,
      message: 'Enter your attendance data to get started.',
      insights: [],
    }
  }

  const currentPercentage = (attended / total) * 100

  // Safe bunks: attended/(total+b)*100 >= required → b <= attended*100/required - total
  const safeBunks = Math.max(0, Math.floor((attended * 100) / required - total))

  // Classes needed: (attended+x)/(total+x)*100 >= required → x >= (required*total - 100*attended)/(100-required)
  let classesNeeded = 0
  if (currentPercentage < required && required < 100) {
    classesNeeded = Math.ceil(
      (required * total - 100 * attended) / (100 - required)
    )
  }

  const status = deriveStatus(currentPercentage, required)
  const message = buildMessage(currentPercentage, required, safeBunks, classesNeeded)
  const insights = buildInsights(currentPercentage, required, safeBunks, classesNeeded)

  return {
    currentPercentage: Math.round(currentPercentage * 10) / 10,
    status,
    safeBunks,
    classesNeeded,
    message,
    insights,
  }
}

function deriveStatus(current: number, required: number): 'safe' | 'warning' | 'danger' {
  const buffer = current - required
  if (buffer >= 10) return 'safe'
  if (buffer >= 0) return 'warning'
  return 'danger'
}

function buildMessage(
  current: number,
  required: number,
  safeBunks: number,
  classesNeeded: number
): string {
  if (current < required) {
    return `Attend the next ${classesNeeded} class${classesNeeded !== 1 ? 'es' : ''} continuously to reach ${required}%.`
  }
  if (safeBunks === 0) {
    return "You're right at the limit. Don't miss any more classes!"
  }
  if (safeBunks === 1) {
    return "You can safely bunk 1 more class. Use it wisely!"
  }
  return `You can safely bunk ${safeBunks} more classes. You're in great shape!`
}

function buildInsights(
  current: number,
  required: number,
  safeBunks: number,
  classesNeeded: number
): string[] {
  const insights: string[] = []

  if (current >= 95) {
    insights.push("Perfect attendance! Maximum academic flexibility achieved.")
  } else if (current >= 90) {
    insights.push("Excellent attendance. You have a very comfortable buffer.")
  } else if (current >= required + 10) {
    insights.push("Your attendance is healthy. You have enough room to breathe.")
  } else if (current >= required) {
    insights.push("You're just above the minimum. Be careful — don't miss more classes.")
  } else {
    insights.push(
      `Danger zone! You're ${(required - current).toFixed(1)}% below the ${required}% requirement.`
    )
  }

  if (safeBunks >= 5) {
    insights.push(`Great buffer — you can skip up to ${safeBunks} more classes and still pass.`)
  }

  if (classesNeeded > 0 && classesNeeded <= 10) {
    insights.push(`Just ${classesNeeded} consecutive classes will get you back on track.`)
  } else if (classesNeeded > 10) {
    insights.push(`You need ${classesNeeded} consecutive classes to recover — start immediately!`)
  }

  return insights
}
