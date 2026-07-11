// UPES Academic Calendar 2026–27 (w.e.f. 01.07.2026).
// Sourced from the college academic calendar. Dates are factual; verify against
// the official notice for any late changes. Category rule: rows the calendar
// marks "Holiday on account of ..." are holidays; examination rows are exams;
// everything else (classes, registrations, results, fests, fee dates) is academic.

export type EventCategory = 'academic' | 'exam' | 'holiday' | 'fest'

export interface AcademicEvent {
  id: string
  title: string
  start: string // ISO YYYY-MM-DD
  end: string   // ISO YYYY-MM-DD (same as start for single-day events)
  category: EventCategory
}

export const CATEGORY_STYLE: Record<
  EventCategory,
  { label: string; dot: string; pill: string; legend: string; barText: string }
> = {
  academic: {
    label: 'Academic',
    dot: 'bg-indigo-500',
    // Dark mode: white text — indigo-200 on the translucent indigo fill was too low-contrast.
    pill: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-700 dark:text-white',
    legend: 'bg-indigo-500',
    barText: 'text-indigo-700 dark:text-indigo-200',
  },
  exam: {
    label: 'Exam',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-200',
    legend: 'bg-amber-500',
    barText: 'text-amber-700 dark:text-amber-200',
  },
  holiday: {
    label: 'Holiday',
    dot: 'bg-rose-500',
    pill: 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-200',
    legend: 'bg-rose-500',
    barText: 'text-rose-700 dark:text-rose-200',
  },
  fest: {
    label: 'UPES Fest',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-200',
    legend: 'bg-emerald-500',
    barText: 'text-emerald-700 dark:text-emerald-200',
  },
}

// Navigable range of the calendar (first event is 30 Jun 2026, last is 16 Aug 2027).
export const CALENDAR_MIN = { year: 2026, month: 5 } // June 2026 (0-indexed month)
export const CALENDAR_MAX = { year: 2027, month: 7 } // August 2027
export const CALENDAR_DEFAULT = { year: 2026, month: 6 } // July 2026

export const ACADEMIC_EVENTS: AcademicEvent[] = [
  { id: 'commencement-pg-sob', title: 'Commencement of Classes / Induction — 1st Year PG (SOB)', start: '2026-06-30', end: '2026-07-01', category: 'academic' },
  { id: 'reg-supp-exam', title: 'Registration: Supplementary Examination (Odd & Even)', start: '2026-07-01', end: '2026-07-07', category: 'academic' },
  { id: 'commencement-pg-socs', title: 'Commencement of Classes / Induction — 1st Year PG (SOCS)', start: '2026-07-06', end: '2026-07-07', category: 'academic' },
  { id: 'commencement-pg-soae', title: 'Commencement of Classes / Induction — 1st Year PG (SOAE)', start: '2026-07-08', end: '2026-07-09', category: 'academic' },
  { id: 'fee-2nd-yr', title: "Last Date for Fee Submission (2nd Year & onwards)", start: '2026-07-10', end: '2026-07-10', category: 'academic' },
  { id: 'commencement-ug-pg-sol', title: 'Commencement of Classes / Induction — 1st Year UG & PG (SOL)', start: '2026-07-13', end: '2026-07-14', category: 'academic' },
  { id: 'commencement-ug-pg-sod', title: 'Commencement of Classes / Induction — 1st Year UG & PG (SOD)', start: '2026-07-15', end: '2026-07-15', category: 'academic' },
  { id: 'holiday-harela', title: 'Holiday — Harela', start: '2026-07-16', end: '2026-07-16', category: 'holiday' },
  { id: 'commencement-ug-socs-1', title: 'Commencement of Classes / Induction — 1st Year UG (SOCS)', start: '2026-07-17', end: '2026-07-18', category: 'academic' },
  { id: 'summer-supp-exam', title: 'Summer Semester / Supplementary Examination (Odd & Even)', start: '2026-07-20', end: '2026-07-21', category: 'exam' },
  { id: 'commencement-ug-socs-2', title: 'Commencement of Classes / Induction — 1st Year UG (SOCS)', start: '2026-07-20', end: '2026-07-21', category: 'academic' },
  { id: 'commencement-ug-socs-3', title: 'Commencement of Classes / Induction — 1st Year UG (SOCS)', start: '2026-07-22', end: '2026-07-23', category: 'academic' },
  { id: 'commencement-ug-socs-4', title: 'Commencement of Classes / Induction — 1st Year UG (SOCS)', start: '2026-07-24', end: '2026-07-25', category: 'academic' },
  { id: 'commencement-ug-sob', title: 'Commencement of Classes / Induction — 1st Year UG + Integrated (SOB)', start: '2026-07-27', end: '2026-07-28', category: 'academic' },
  { id: 'commencement-ug-pg-solsh', title: 'Commencement of Classes / Induction — 1st Year UG + PG (SOLSH)', start: '2026-07-29', end: '2026-07-29', category: 'academic' },
  { id: 'commencement-ug-pg-sohst', title: 'Commencement of Classes / Induction — 1st Year UG & PG (SOHST)', start: '2026-07-30', end: '2026-07-30', category: 'academic' },
  { id: 'commencement-ug-soae', title: 'Commencement of Classes / Induction — 1st Year UG (SOAE)', start: '2026-07-31', end: '2026-08-01', category: 'academic' },
  { id: 'commencement-2nd-yr', title: 'Commencement of Classes — 2nd Year Onwards', start: '2026-08-03', end: '2026-08-03', category: 'academic' },
  { id: 'holiday-independence', title: 'Holiday — Independence Day', start: '2026-08-15', end: '2026-08-15', category: 'holiday' },
  { id: 'result-summer-supp', title: 'Result Declaration: Summer Semester / Supplementary Exam (Odd & Even)', start: '2026-08-17', end: '2026-08-17', category: 'academic' },
  { id: 'bpharma-sessional-1a', title: 'B.Pharma Internal First Sessional Examination', start: '2026-09-07', end: '2026-09-11', category: 'exam' },
  { id: 'happiness-day', title: 'Happiness Day', start: '2026-09-11', end: '2026-09-11', category: 'academic' },
  { id: 'tq-mid-1', title: 'TQ Feedback — Mid Semester (Portal link enabled)', start: '2026-09-22', end: '2026-09-30', category: 'academic' },
  { id: 'holiday-gandhi', title: 'Holiday — Gandhi Jayanti', start: '2026-10-02', end: '2026-10-02', category: 'holiday' },
  { id: 'mid-sem-odd', title: 'Mid Semester Examination (Odd Semester — All Courses)', start: '2026-10-05', end: '2026-10-10', category: 'exam' },
  { id: 'spandan', title: 'Spandan — Sports Event', start: '2026-10-15', end: '2026-10-18', category: 'fest' },
  { id: 'convocation', title: 'Convocation Week', start: '2026-10-23', end: '2026-10-27', category: 'academic' },
  { id: 'bpharma-sessional-2a', title: 'B.Pharma Internal Second Sessional Examination', start: '2026-10-26', end: '2026-10-30', category: 'exam' },
  { id: 'holiday-diwali', title: 'Holiday — Diwali Break', start: '2026-11-09', end: '2026-11-14', category: 'holiday' },
  { id: 'tq-end-1', title: 'TQ Feedback — End Semester (Portal link enabled)', start: '2026-11-17', end: '2026-11-28', category: 'academic' },
  { id: 'holiday-gurunanak', title: 'Holiday — Guru Nanak Dev Birthday', start: '2026-11-24', end: '2026-11-24', category: 'holiday' },
  { id: 'last-teaching-odd', title: 'Last Day of Teaching (Odd Semester)', start: '2026-12-02', end: '2026-12-02', category: 'academic' },
  { id: 'end-sem-odd', title: 'End Semester Examination — Odd Semester (Theory & Lab)', start: '2026-12-08', end: '2026-12-24', category: 'exam' },
  { id: 'answer-viewing-odd-1', title: 'Answer Script Viewing Window', start: '2026-12-14', end: '2026-12-24', category: 'academic' },
  { id: 'holiday-winter', title: 'Holiday — Winter Break', start: '2026-12-25', end: '2026-12-31', category: 'holiday' },
  { id: 'new-year', title: 'New Year Day', start: '2027-01-01', end: '2027-01-01', category: 'academic' },
  { id: 'fee-all', title: 'Last Date for Fee Submission (All Students)', start: '2027-01-02', end: '2027-01-02', category: 'academic' },
  { id: 'answer-viewing-odd-2', title: 'Answer Script Viewing Window', start: '2027-01-04', end: '2027-01-05', category: 'academic' },
  { id: 'award-sheet-1', title: 'Last Date of Submission of Award Sheet & Answer Script', start: '2027-01-10', end: '2027-01-10', category: 'academic' },
  { id: 'commencement-even', title: 'Commencement of Classes — Even Semester', start: '2027-01-11', end: '2027-01-11', category: 'academic' },
  { id: 'result-end-odd', title: 'Declaration of Result — End Semester Examination', start: '2027-01-18', end: '2027-01-18', category: 'academic' },
  { id: 'reeval-reg-1', title: 'Re-Evaluation Registration (End Semester Examination)', start: '2027-01-20', end: '2027-01-22', category: 'academic' },
  { id: 'reg-supp-grad', title: 'Registration for Supplementary Exam — Graduating Batch (Odd & Even)', start: '2027-01-22', end: '2027-01-27', category: 'academic' },
  { id: 'food-festival', title: 'Food Festival', start: '2027-01-22', end: '2027-01-22', category: 'academic' },
  { id: 'holiday-republic', title: 'Holiday — Republic Day', start: '2027-01-26', end: '2027-01-26', category: 'holiday' },
  { id: 'supp-exam-grad', title: 'Supplementary Examination — Graduating Batch', start: '2027-02-09', end: '2027-02-16', category: 'exam' },
  { id: 'result-reeval-1', title: 'Declaration of Result — After Re-Evaluation', start: '2027-02-10', end: '2027-02-10', category: 'academic' },
  { id: 'bpharma-sessional-1b', title: 'B.Pharma Internal First Sessional Examination', start: '2027-02-15', end: '2027-02-20', category: 'exam' },
  { id: 'tq-mid-2', title: 'TQ Feedback — Mid Semester (Portal link enabled)', start: '2027-02-15', end: '2027-02-27', category: 'academic' },
  { id: 'mid-sem-even', title: 'Mid Semester Examination (All Courses)', start: '2027-03-01', end: '2027-03-06', category: 'exam' },
  { id: 'result-supp-grad', title: 'Declaration of Result — Supplementary Examination (Graduating Batch)', start: '2027-03-01', end: '2027-03-01', category: 'academic' },
  { id: 'holiday-idulfitr', title: 'Holiday — Id-ul-Fitr*', start: '2027-03-10', end: '2027-03-10', category: 'holiday' },
  { id: 'holiday-holi', title: 'Holiday — Holi', start: '2027-03-22', end: '2027-03-22', category: 'holiday' },
  { id: 'holiday-goodfriday', title: 'Holiday — Good Friday', start: '2027-03-26', end: '2027-03-26', category: 'holiday' },
  { id: 'urja', title: 'Urja', start: '2027-04-02', end: '2027-04-04', category: 'fest' },
  { id: 'summer-reg', title: 'Summer Semester Registration (Odd & Even)', start: '2027-04-15', end: '2027-04-30', category: 'academic' },
  { id: 'bpharma-sessional-2b', title: 'B.Pharma Internal Second Sessional Examination', start: '2027-04-19', end: '2027-04-24', category: 'exam' },
  { id: 'last-teaching-even', title: 'Last Day of Teaching (Even Semester)', start: '2027-05-01', end: '2027-05-01', category: 'academic' },
  { id: 'end-sem-even', title: 'End Semester Examination — Even Semester (Theory & Lab)', start: '2027-05-05', end: '2027-05-22', category: 'exam' },
  { id: 'answer-viewing-even', title: 'Answer Sheet Viewing Window', start: '2027-05-10', end: '2027-05-27', category: 'academic' },
  { id: 'internship', title: 'Internship — Summer / Srijan / Samarth', start: '2027-05-25', end: '2027-07-30', category: 'academic' },
  { id: 'summer-sem', title: 'Commencement of Summer Semester', start: '2027-05-31', end: '2027-07-24', category: 'academic' },
  { id: 'award-sheet-2', title: 'Last Date of Submission of Award Sheet & Answer Script', start: '2027-06-02', end: '2027-06-02', category: 'academic' },
  { id: 'result-end-even', title: 'Declaration of Result — End Semester Examination', start: '2027-06-08', end: '2027-06-08', category: 'academic' },
  { id: 'reg-summer-even', title: 'Registration for Summer Semester (Even Semester)', start: '2027-06-10', end: '2027-06-15', category: 'academic' },
  { id: 'reeval-reg-2', title: 'Registration — Re-Evaluation (End Semester Examination)', start: '2027-06-11', end: '2027-06-15', category: 'academic' },
  { id: 'result-reeval-2', title: 'Declaration of Result — After Re-Evaluation', start: '2027-06-30', end: '2027-06-30', category: 'academic' },
  { id: 'reg-supp-odd-even', title: 'Registration for Supplementary Exam (Odd & Even Sem)', start: '2027-07-02', end: '2027-07-06', category: 'academic' },
  { id: 'fee-2nd-yr-2', title: 'Last Date for Fee Submission (2nd Year Onwards)', start: '2027-07-10', end: '2027-07-10', category: 'academic' },
  { id: 'exam-summer-supp', title: 'Examination — Summer Semester / Supplementary Exam (Odd & Even Sem)', start: '2027-07-20', end: '2027-07-31', category: 'exam' },
  { id: 'result-summer-supp-2', title: 'Result Declaration — Summer Semester / Supplementary Exam (Odd & Even Sem)', start: '2027-08-16', end: '2027-08-16', category: 'academic' },
]

// ── helpers ───────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (year: number, month0: number, day: number) => `${year}-${pad(month0 + 1)}-${pad(day)}`

export function eventsOnDay(iso: string): AcademicEvent[] {
  return ACADEMIC_EVENTS.filter(e => e.start <= iso && iso <= e.end)
}

export function eventsInMonth(year: number, month0: number): AcademicEvent[] {
  const first = toISO(year, month0, 1)
  const last = toISO(year, month0, new Date(year, month0 + 1, 0).getDate())
  // overlaps the month if it starts on/before the last day and ends on/after the first day
  return ACADEMIC_EVENTS
    .filter(e => e.start <= last && e.end >= first)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
}
