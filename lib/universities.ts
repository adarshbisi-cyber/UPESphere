import type { UniversityPreset } from '@/types'

export const UNIVERSITIES: UniversityPreset[] = [
  {
    id: 'vtu',
    name: 'Visvesvaraya Technological University',
    shortName: 'VTU',
    gradeScale: '10',
    minAttendance: 85,
    gradingSystem: {
      scale: '10 Point',
      maxGPA: 10,
      grades: [
        { grade: 'O',  points: 10, range: '90-100', description: 'Outstanding' },
        { grade: 'A+', points: 9,  range: '80-89',  description: 'Excellent' },
        { grade: 'A',  points: 8,  range: '70-79',  description: 'Very Good' },
        { grade: 'B+', points: 7,  range: '60-69',  description: 'Good' },
        { grade: 'B',  points: 6,  range: '55-59',  description: 'Above Average' },
        { grade: 'C',  points: 5,  range: '50-54',  description: 'Average' },
        { grade: 'P',  points: 4,  range: '40-49',  description: 'Pass' },
        { grade: 'F',  points: 0,  range: '0-39',   description: 'Fail' },
      ],
    },
    creditSystem: 'CBCS',
    description: 'Largest Technical University in India',
  },
  {
    id: 'srm',
    name: 'SRM Institute of Science and Technology',
    shortName: 'SRM',
    gradeScale: '10',
    minAttendance: 75,
    gradingSystem: {
      scale: '10 Point',
      maxGPA: 10,
      grades: [
        { grade: 'O',  points: 10, range: '91-100', description: 'Outstanding' },
        { grade: 'A+', points: 9,  range: '81-90',  description: 'Excellent' },
        { grade: 'A',  points: 8,  range: '71-80',  description: 'Very Good' },
        { grade: 'B+', points: 7,  range: '61-70',  description: 'Good' },
        { grade: 'B',  points: 6,  range: '51-60',  description: 'Average' },
        { grade: 'C',  points: 5,  range: '45-50',  description: 'Satisfactory' },
        { grade: 'P',  points: 4,  range: '40-44',  description: 'Pass' },
        { grade: 'F',  points: 0,  range: '0-39',   description: 'Fail' },
      ],
    },
    creditSystem: 'Credit Based',
    description: 'Premier Deemed University, Chennai',
  },
  {
    id: 'kiit',
    name: 'Kalinga Institute of Industrial Technology',
    shortName: 'KIIT',
    gradeScale: '10',
    minAttendance: 75,
    gradingSystem: {
      scale: '10 Point',
      maxGPA: 10,
      grades: [
        { grade: 'O', points: 10, range: '90-100', description: 'Outstanding' },
        { grade: 'E', points: 9,  range: '80-89',  description: 'Excellent' },
        { grade: 'A', points: 8,  range: '70-79',  description: 'Very Good' },
        { grade: 'B', points: 7,  range: '60-69',  description: 'Good' },
        { grade: 'C', points: 6,  range: '50-59',  description: 'Average' },
        { grade: 'D', points: 5,  range: '40-49',  description: 'Pass' },
        { grade: 'F', points: 0,  range: '0-39',   description: 'Fail' },
      ],
    },
    creditSystem: 'Credit Based Semester System',
    description: 'Deemed to be University, Bhubaneswar',
  },
  {
    id: 'anna',
    name: 'Anna University',
    shortName: 'Anna University',
    gradeScale: '10',
    minAttendance: 75,
    gradingSystem: {
      scale: '10 Point',
      maxGPA: 10,
      grades: [
        { grade: 'O',  points: 10, range: '91-100', description: 'Outstanding' },
        { grade: 'A+', points: 9,  range: '81-90',  description: 'Excellent' },
        { grade: 'A',  points: 8,  range: '71-80',  description: 'Very Good' },
        { grade: 'B+', points: 7,  range: '61-70',  description: 'Good' },
        { grade: 'B',  points: 6,  range: '57-60',  description: 'Above Average' },
        { grade: 'C',  points: 5,  range: '50-56',  description: 'Satisfactory' },
        { grade: 'RA', points: 0,  range: '0-49',   description: 'Reappear' },
      ],
    },
    creditSystem: 'Regulation 2021',
    description: 'Tamil Nadu State Technical University',
  },
  {
    id: 'upes',
    name: 'University of Petroleum and Energy Studies',
    shortName: 'UPES',
    gradeScale: '10',
    minAttendance: 75,
    gradingSystem: {
      scale: '10 Point',
      maxGPA: 10,
      grades: [
        { grade: 'A+', points: 10, range: '90-100', description: 'Outstanding' },
        { grade: 'A',  points: 9,  range: '80-89',  description: 'Excellent' },
        { grade: 'B+', points: 8,  range: '70-79',  description: 'Very Good' },
        { grade: 'B',  points: 7,  range: '60-69',  description: 'Good' },
        { grade: 'C+', points: 6,  range: '50-59',  description: 'Average' },
        { grade: 'C',  points: 5,  range: '45-49',  description: 'Pass' },
        { grade: 'F',  points: 0,  range: '0-44',   description: 'Fail' },
      ],
    },
    creditSystem: 'Credit Based',
    description: 'Petroleum & Energy Focused University, Dehradun',
  },
  {
    id: 'generic_10',
    name: 'Generic University (10 Point Scale)',
    shortName: 'Generic 10',
    gradeScale: '10',
    minAttendance: 75,
    gradingSystem: {
      scale: '10 Point',
      maxGPA: 10,
      grades: [
        { grade: 'O',  points: 10, description: 'Outstanding' },
        { grade: 'A+', points: 9,  description: 'Excellent' },
        { grade: 'A',  points: 8,  description: 'Very Good' },
        { grade: 'B+', points: 7,  description: 'Good' },
        { grade: 'B',  points: 6,  description: 'Above Average' },
        { grade: 'C',  points: 5,  description: 'Average' },
        { grade: 'P',  points: 4,  description: 'Pass' },
        { grade: 'F',  points: 0,  description: 'Fail' },
      ],
    },
    creditSystem: 'Credit Based',
    description: 'Standard 10-Point Grading System',
  },
  {
    id: 'generic_4',
    name: 'Generic University (4 Point Scale)',
    shortName: 'Generic 4',
    gradeScale: '4',
    minAttendance: 75,
    gradingSystem: {
      scale: '4 Point',
      maxGPA: 4,
      grades: [
        { grade: 'A',  points: 4.0, description: 'Excellent' },
        { grade: 'A-', points: 3.7, description: 'Very Good' },
        { grade: 'B+', points: 3.3, description: 'Good' },
        { grade: 'B',  points: 3.0, description: 'Above Average' },
        { grade: 'B-', points: 2.7, description: 'Average' },
        { grade: 'C+', points: 2.3, description: 'Below Average' },
        { grade: 'C',  points: 2.0, description: 'Satisfactory' },
        { grade: 'C-', points: 1.7, description: 'Pass' },
        { grade: 'D',  points: 1.0, description: 'Barely Pass' },
        { grade: 'F',  points: 0.0, description: 'Fail' },
      ],
    },
    creditSystem: 'Semester Credit Hours',
    description: 'Standard US/International 4-Point Scale',
  },
]

export function getUniversity(id: string): UniversityPreset | undefined {
  return UNIVERSITIES.find(u => u.id === id)
}

export function getUniversityBySlug(slug: string): UniversityPreset | undefined {
  const map: Record<string, string> = {
    vtu: 'vtu',
    srm: 'srm',
    kiit: 'kiit',
    'anna-university': 'anna',
    upes: 'upes',
  }
  const id = map[slug.toLowerCase()] ?? slug
  return getUniversity(id)
}

export const UNIVERSITY_SLUGS = ['vtu', 'srm', 'kiit', 'anna-university', 'upes']
