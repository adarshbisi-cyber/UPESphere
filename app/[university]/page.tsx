import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { GPACalculator } from '@/components/calculators/GPACalculator'
import { UNIVERSITIES, UNIVERSITY_SLUGS, getUniversityBySlug } from '@/lib/universities'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: { university: string }
}

export async function generateStaticParams() {
  return UNIVERSITY_SLUGS.map(slug => ({ university: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const uni = getUniversityBySlug(params.university)
  if (!uni) return { title: 'Not Found' }

  const title = `${uni.shortName} GPA Calculator — Free SGPA & CGPA Tool`
  const description = `Free GPA calculator for ${uni.name} students. Supports ${uni.gradingSystem.scale}, ${uni.minAttendance}% minimum attendance, ${uni.creditSystem} credit system.`

  return {
    title,
    description,
    keywords: [
      `${uni.shortName} GPA calculator`,
      `${uni.shortName} CGPA calculator`,
      `${uni.shortName} attendance calculator`,
      `${uni.name} GPA`,
      `${uni.shortName} grading system`,
    ],
    openGraph: { title, description },
  }
}

export default function UniversityPage({ params }: PageProps) {
  const uni = getUniversityBySlug(params.university)
  if (!uni) notFound()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="indigo">{uni.shortName}</Badge>
            <Badge variant="violet">{uni.gradingSystem.scale}</Badge>
            <Badge variant="cyan">{uni.minAttendance}% min attendance</Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-3">
            {uni.shortName}{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              GPA Calculator
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {uni.name} — {uni.description}. This calculator is pre-configured with {uni.shortName}&apos;s official grading scheme.
          </p>
        </div>

        {/* Grading table */}
        <div className="max-w-4xl mx-auto mb-8 rounded-2xl p-6" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
          <h2 className="text-base font-semibold font-display mb-4">{uni.shortName} Grading System</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-white/8">
                  <th className="text-left pb-3 pr-6">Grade</th>
                  <th className="text-left pb-3 pr-6">Grade Points</th>
                  {uni.gradingSystem.grades[0].range && <th className="text-left pb-3 pr-6">Marks Range</th>}
                  <th className="text-left pb-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {uni.gradingSystem.grades.map(g => (
                  <tr key={g.grade}>
                    <td className="py-2.5 pr-6 font-semibold text-foreground">{g.grade}</td>
                    <td className="py-2.5 pr-6 font-mono text-indigo-300">{g.points}</td>
                    {g.range && <td className="py-2.5 pr-6 text-muted-foreground">{g.range}%</td>}
                    <td className="py-2.5 text-muted-foreground">{g.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <GPACalculator />
        </div>
      </div>
    </main>
  )
}
