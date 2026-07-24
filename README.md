# UPESphere — Smart Academic Companion

> Track your academic life smarter. Calculate GPA, CGPA, and attendance, upload your grade cards and timetable, find teammates for competitions, and stay on top of deadlines — built for Gen Z Indian university students.

![UPESphere Banner](https://placehold.co/1200x400/0a0a0f/6366f1?text=UPESphere)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| UI Components | ShadCN UI (Radix Primitives) |
| Charts | Recharts |
| Backend | Supabase (Auth + Postgres + RLS + Realtime) |
| PDF/OCR parsing | pdfjs-dist, Tesseract.js |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

## Features

### Core Calculators
- **GPA Calculator** — Supports 10-point (VTU, SRM, KIIT, Anna), 4-point (US scale), and percentage modes. Dynamic subject rows, real-time calculation.
- **CGPA Calculator** — Semester-wise entry, cumulative CGPA with trend chart, and a target CGPA predictor (`/calculators/gpa-target`).
- **Attendance Calculator** — Current percentage, safe-bunk count, recovery classes needed, circular health gauge.
- **Expected Total Predictor** (`/calculators/expected-total`) — Forecasts final subject score and passing probability.

### Academic Workspace & Onboarding
- Guided first-run setup (`/workspace/setup`) that walks a new user through their university, course, and semester details.
- **Grade Card upload** — Parses university grade-sheet PDFs client-side (pdfjs-dist) to auto-fill subjects, credits, and grades, with an editable review screen before saving.
- **Timetable upload** — Parses timetable PDFs into structured weekly slots, with versioning so a re-upload doesn't clobber history.
- **Curriculum scanner** — OCR-based (Tesseract.js) curriculum screenshot import to auto-fill subjects and credits.
- Interactive document cards on the Dashboard for managing grade sheets, timetables, and profile details.

### Dashboard & Gradebook
- Academic Operating System-style dashboard: Current GPA, CGPA, Attendance %, Safe Bunks, Academic Health Score, SGPA/CGPA trend chart, rule-based insight cards.
- **Gradebook** (`/gradebook`) — Full semester-by-semester grade history, degree progress, and weighted credit-based analytics, backed by a dedicated insights calculation layer.
- **Weekly Timetable** and **Today's Classes** widgets (timeline view) driven by the parsed/uploaded timetable.

### TeamUp — Competition Team Formation
- Post a "Create Team Request" for a competition (hackathon, case comp, etc.) with current/max team size, required skills, deadline, and experience preference.
- Browse and filter open team requests, request to join, and manage incoming join requests as a team creator.
- Discover students and send direct invitations.
- **My TeamUp** dashboard for tracking your own teams, applications, and invitations in one place.
- Custom skill tags ("+ Other") with fuzzy duplicate detection, promotable by admins later.
- Concurrency-safe team-capacity handling via Postgres RPCs — accepting a member or removing one always keeps `current_members`/`max_members` consistent, even under concurrent requests.

### Notifications
- UPESphere-wide, realtime notification system (not just TeamUp) — navbar bell with a live unread badge, dropdown preview, and a full `/notifications` page with filter tabs (All, Unread, TeamUp, Academics, System).
- Server-side triggers (Postgres `security definer` functions) create notifications exactly once on real events — team invitations, join requests, member removal, grade-sheet processing — never relying on client-side polling.

### Community & Career
- **Community** (`/community`) — study squads, peer Q&A, and campus chatter (teaser page; TeamUp is the live team-formation feature reachable from the Community nav dropdown).
- **Career** (`/career`) — internships, placements, and opportunities matched to your academic profile.
- Both are authenticated-only features, gated by middleware with a redirect back after sign-in.

### Calendars
- **Academic Calendar** — class start dates, exams, results, and holidays for the current session.
- **Case Comp Calendar** — case competitions and B-fests from IIMs, IITs, and DU, mapped month by month.
- **Hackathon Calendar** — hackathons and innovation challenges worldwide, mapped by track and month.

### Landing Page
- Animated hero with gradient mesh background
- Live interactive GPA and attendance demos

### Auth
- Email + Password login/signup with friendly validation errors (no raw Supabase/Postgres errors surfaced to users)
- Google OAuth (via Supabase)
- Email verification gate — unverified users are blocked from protected routes until confirmed
- Auto-creates profile on first sign-in; middleware redirects first-time users into onboarding

## Project Structure

```
UPESphere/
├── app/
│   ├── (auth)/login/          # Login / Signup, verify-email, reset-password
│   ├── [university]/          # Dynamic SEO pages (/vtu, /srm, ...)
│   ├── academic-calendar/      # Academic calendar
│   ├── attendance/             # Attendance calculator
│   ├── calculators/            # GPA Target, Expected Total sub-calculators
│   ├── career/                 # Career teaser (authenticated)
│   ├── case-comp/              # Case competition calendar
│   ├── cgpa/                   # CGPA calculator
│   ├── community/              # Community teaser (authenticated)
│   ├── dashboard/               # Personal Academic Operating System dashboard
│   ├── gpa/                     # GPA calculator
│   ├── gradebook/                # Full grade history + analytics
│   ├── hackathons/                # Hackathon calendar
│   ├── notifications/              # Full notification center
│   ├── teamup/                      # Team-formation marketplace (feed, detail, mine, students)
│   ├── workspace/setup/               # First-run onboarding flow
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                        # Landing page
├── components/
│   ├── academic/                # Academic Workspace document cards
│   ├── analytics/                # Vercel analytics wrapper
│   ├── auth/                      # AuthProvider, auth form components
│   ├── calculators/                # GPACalculator, CGPACalculator, AttendanceCalculator
│   ├── career/                      # Career teaser components
│   ├── casecomp/, hackathons/         # Calendar components
│   ├── community/                     # Community teaser components
│   ├── dashboard/                       # StatsCard, CGPATrend, InsightsPanel
│   ├── gradebook/                        # Gradebook widgets
│   ├── landing/                            # Hero, Features, demos, Testimonials, FAQ, Footer
│   ├── notifications/                       # NotificationBell, NotificationsProvider, NotificationItem
│   ├── onboarding/                            # Onboarding flow steps
│   ├── shared/                                # Navbar
│   ├── teamup/                                  # CreateTeamModal, TeamCard, SkillPicker, JoinRequestModal, ...
│   ├── ui/                                       # ShadCN components (Button, Card, Input, Tabs, ...)
│   └── providers.tsx                               # ThemeProvider + Toaster
├── lib/
│   ├── analytics.ts
│   ├── auth/                     # Validation + friendly-error helpers
│   ├── calculations/               # gpa.ts, cgpa.ts, attendance.ts
│   ├── curriculum-parser.ts          # OCR curriculum screenshot parser
│   ├── data/                           # Shared calculation/data helpers
│   ├── gradebook/                        # Gradebook data + insights layer
│   ├── notifications/                      # Notifications data layer (lib/notifications/api.ts)
│   ├── onboarding/                           # Onboarding + save-error helpers
│   ├── parsers/                                 # Grade-card & timetable PDF parsers
│   ├── supabase/                                  # client.ts
│   ├── teamup/                                      # TeamUp data layer (lib/teamup/api.ts)
│   ├── timetable/                                     # Shared timetable display utilities
│   ├── universities.ts                                  # University presets
│   └── utils.ts
├── supabase/
│   ├── schema.sql                                        # Base schema + RLS policies
│   ├── onboarding-migration.sql
│   ├── curriculum-semester-migration.sql
│   ├── timetable-versioning-migration.sql
│   ├── total-semesters-migration.sql
│   ├── teamup-migration.sql
│   ├── teamup-membership-fix-migration.sql
│   ├── teamup-team-size-constraint-migration.sql
│   ├── notifications-migration.sql
│   └── email-exists-function.sql
├── test/                                                    # Vitest + RTL unit/component tests
├── middleware.ts                                              # Auth + onboarding + email-verification gating
├── types/
└── .env.local.example
```

## Design System

- **Background**: `#0a0a0f` (near-black navy)
- **Primary**: Indigo `#6366f1` → Violet `#8b5cf6`
- **Accent**: Cyan `#06b6d4`
- **Typography**: Inter (body) + Space Grotesk (display/headings)
- **Cards**: Glassmorphism (`bg-white/5 backdrop-blur border-white/10`) for surfaces meant to sit under a blur, opaque `--dropdown-*` tokens for floating menus/panels that shouldn't be see-through
- **Animations**: Framer Motion — page transitions, stagger, spring physics

