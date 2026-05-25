export type GradeScale = '10' | '4' | 'percentage'

export type AttendanceStatus = 'safe' | 'warning' | 'danger'

export interface Subject {
  id: string
  name: string
  credits: number
  grade: string
  gradePoints?: number
}

export interface Semester {
  id: string
  name: string
  sgpa: number
  credits: number
}

export interface GPAResult {
  sgpa: number
  totalCredits: number
  percentageEquivalent: number
  gradePoints: number
  insights: string[]
}

export interface CGPAResult {
  cgpa: number
  totalCredits: number
  percentageEquivalent: number
  semesterCount: number
  trend: 'improving' | 'declining' | 'stable'
  insights: string[]
}

export interface AttendanceResult {
  currentPercentage: number
  status: AttendanceStatus
  safeBunks: number
  classesNeeded: number
  message: string
  insights: string[]
}

export interface GradeEntry {
  grade: string
  points: number
  range?: string
  description?: string
}

export interface GradingSystem {
  grades: GradeEntry[]
  scale: string
  maxGPA: number
}

export interface UniversityPreset {
  id: string
  name: string
  shortName: string
  gradeScale: GradeScale
  minAttendance: number
  gradingSystem: GradingSystem
  creditSystem: string
  description: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  university?: string
  semester?: number
  createdAt: string
}

export interface SavedCalculation {
  id: string
  userId: string
  type: 'gpa' | 'cgpa' | 'attendance'
  data: unknown
  result: unknown
  createdAt: string
}

export interface DashboardStats {
  currentGPA?: number
  currentCGPA?: number
  attendancePercentage?: number
  safeBunks?: number
  academicHealthScore: number
  trend: 'up' | 'down' | 'stable'
}

export interface NavItem {
  label: string
  href: string
  icon?: string
}
