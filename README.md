# UPESphere — Smart Academic Companion

> Track your academic life smarter. Calculate GPA, CGPA, attendance, and get AI-powered insights — built for Gen Z Indian university students.

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
| Backend | Supabase (Auth + Postgres) |
| Deployment | Vercel |

## Features

### Core Calculators
- **GPA Calculator** — Supports 10-point (VTU, SRM, KIIT, Anna), 4-point (US scale), and percentage modes. Dynamic subject rows, real-time calculation.
- **CGPA Calculator** — Semester-wise entry, cumulative CGPA with trend chart, and a target CGPA predictor.
- **Attendance Calculator** — Current percentage, safe-bunk count, recovery classes needed, circular health gauge.

### University Presets
Pre-configured grading systems for:
- VTU (85% attendance, O/A+/A/B+/B/C/P/F — 10 pt)
- SRM (75% attendance, 10 pt scale)
- KIIT (75% attendance, O/E/A/B/C/D/F — 10 pt)
- Anna University (75% attendance, Regulation 2021)
- UPES (75% attendance, 10 pt scale)
- Generic 10-point and 4-point scale

### Dashboard
- Stats cards: Current GPA, CGPA, Attendance %, Safe Bunks, Academic Health Score
- SGPA/CGPA trend area chart
- AI-style insight cards (rule-based)
- Quick-action links

### Landing Page
- Animated hero with gradient mesh background
- Live interactive GPA demo
- Live attendance demo with circular gauge
- Feature showcase
- Student testimonials
- FAQ accordion
- SEO-optimised university sub-pages (`/vtu`, `/srm`, `/kiit`, etc.)

### Auth
- Email + Password login/signup
- Google OAuth (via Supabase)
- Auto-creates profile on first sign-in

## Project Structure

```
gradeflow/
├── app/
│   ├── (auth)/login/        # Login / Signup page
│   ├── [university]/        # Dynamic SEO pages (/vtu, /srm, ...)
│   ├── attendance/          # Attendance calculator page
│   ├── cgpa/                # CGPA calculator page
│   ├── gpa/                 # GPA calculator page
│   ├── dashboard/           # Personal dashboard
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   ├── calculators/         # GPACalculator, CGPACalculator, AttendanceCalculator
│   ├── dashboard/           # StatsCard, CGPATrend, InsightsPanel
│   ├── landing/             # Hero, Features, GPADemo, AttendanceDemo, Testimonials, FAQ, Footer
│   ├── shared/              # Navbar
│   ├── ui/                  # ShadCN components (Button, Card, Input, Select, ...)
│   └── providers.tsx        # ThemeProvider + Toaster
├── lib/
│   ├── calculations/        # gpa.ts, cgpa.ts, attendance.ts
│   ├── supabase/            # client.ts
│   ├── universities.ts      # University presets
│   └── utils.ts
├── supabase/
│   └── schema.sql           # Full database schema + RLS policies
├── types/
│   └── index.ts
└── .env.local.example
```

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/gradeflow.git
cd gradeflow
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run the contents of `supabase/schema.sql`
3. Go to **Authentication → Providers** → enable Google OAuth (optional)
4. Copy your Project URL and Anon Key

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Or push to GitHub and connect on [vercel.com](https://vercel.com). Add the env vars in Vercel dashboard.

## SEO Pages

The following static pages are auto-generated for university-specific SEO:

| URL | Title |
|---|---|
| `/vtu` | VTU GPA Calculator |
| `/srm` | SRM GPA Calculator |
| `/kiit` | KIIT GPA Calculator |
| `/anna-university` | Anna University GPA Calculator |
| `/upes` | UPES GPA Calculator |

## Database Tables

| Table | Description |
|---|---|
| `profiles` | User profile (name, email, university, semester) |
| `semesters` | Per-semester SGPA and credit records |
| `gpa_records` | Saved subject-level GPA calculations |
| `attendance_records` | Per-subject attendance tracking |

All tables use Row Level Security — users can only access their own data.

## Design System

- **Background**: `#0a0a0f` (near-black navy)
- **Primary**: Indigo `#6366f1` → Violet `#8b5cf6`
- **Accent**: Cyan `#06b6d4`
- **Typography**: Inter (body) + Space Grotesk (display/headings)
- **Cards**: Glassmorphism (`bg-white/5 backdrop-blur border-white/10`)
- **Animations**: Framer Motion — page transitions, stagger, spring physics

## License

MIT © UPESphere
