// ─── Global gtag type ─────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

// ─── Core primitives ─────────────────────────────────────────────────────────

function gtag(command: string, ...args: unknown[]) {
  if (typeof window === 'undefined') return
  if (!window.gtag) return
  if (!GA_ID) return
  try {
    window.gtag(command, ...args)
  } catch {
    // Analytics failures must never surface to users
  }
}

export function trackPageView(url: string) {
  gtag('config', GA_ID, { page_path: url })
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  gtag('event', name, params)
}

// ─── Typed event catalogue ────────────────────────────────────────────────────

export const GA = {

  // ── GPA Calculator ────────────────────────────────────────────────────────
  gpaSubjectAdded: (totalSubjects: number) =>
    trackEvent('gpa_subject_added', { total_subjects: totalSubjects }),

  gpaSubjectRemoved: (totalSubjects: number) =>
    trackEvent('gpa_subject_removed', { total_subjects: totalSubjects }),

  gpaShared: (sgpa: number, totalCredits: number) =>
    trackEvent('gpa_shared', { sgpa: Math.round(sgpa * 100) / 100, total_credits: totalCredits }),

  gpaScannerOpened: () =>
    trackEvent('curriculum_scanner_opened'),

  gpaSubjectsImported: (subjectCount: number, totalCredits: number) =>
    trackEvent('curriculum_subjects_imported', { subject_count: subjectCount, total_credits: totalCredits }),

  // ── OCR Curriculum Scanner ────────────────────────────────────────────────
  scanDragDropUsed: (fileCount: number) =>
    trackEvent('ocr_drag_drop_used', { file_count: fileCount }),

  scanPasteUsed: () =>
    trackEvent('ocr_paste_used'),

  scanStarted: (fileCount: number) =>
    trackEvent('ocr_scan_started', { file_count: fileCount }),

  scanCompleted: (subjectCount: number, fileCount: number) =>
    trackEvent('ocr_scan_completed', { subject_count: subjectCount, file_count: fileCount }),

  scanFailed: (reason: 'engine_error' | 'no_subjects_found') =>
    trackEvent('ocr_scan_failed', { reason }),

  // ── CGPA Calculator ───────────────────────────────────────────────────────
  cgpaSemesterAdded: (totalSemesters: number) =>
    trackEvent('cgpa_semester_added', { total_semesters: totalSemesters }),

  cgpaSemesterRemoved: (totalSemesters: number) =>
    trackEvent('cgpa_semester_removed', { total_semesters: totalSemesters }),

  cgpaCalculated: (cgpa: number, semesterCount: number) =>
    trackEvent('cgpa_calculated', { cgpa: Math.round(cgpa * 100) / 100, semester_count: semesterCount }),

  cgpaTargetChecked: (targetCgpa: number, remainingSems: number) =>
    trackEvent('cgpa_target_checked', { target_cgpa: targetCgpa, remaining_sems: remainingSems }),

  // ── Attendance Calculator ─────────────────────────────────────────────────
  attendanceCalculated: (percentage: number, status: string) =>
    trackEvent('attendance_calculated', { percentage: Math.round(percentage), status }),

  attendanceBunkPlannerUsed: (plannedTotal: number) =>
    trackEvent('attendance_bunk_planner_used', { planned_total: plannedTotal }),

  // ── Pass Calculator ───────────────────────────────────────────────────────
  passChecked: (endSemMax: number, passingPercent: number) =>
    trackEvent('pass_probability_checked', { end_sem_max: endSemMax, passing_percent: passingPercent }),

  // ── Theme ─────────────────────────────────────────────────────────────────
  themeChanged: (theme: 'light' | 'dark') =>
    trackEvent('theme_changed', { theme }),

  // ── Engagement ────────────────────────────────────────────────────────────
  ctaClicked: (button: string) =>
    trackEvent('cta_clicked', { button }),

  feedbackClicked: (type: 'give_feedback' | 'suggest_feature') =>
    trackEvent('feedback_clicked', { type }),

  faqExpanded: (question: string) =>
    trackEvent('faq_expanded', { question: question.slice(0, 100) }),

  scrollDepth: (depth: 25 | 50 | 75 | 100) =>
    trackEvent('scroll_depth', { depth }),
}
