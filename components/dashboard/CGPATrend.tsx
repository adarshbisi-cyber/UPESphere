'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { GlassCard } from '@/components/ui/card'

const DEMO_DATA = [
  { semester: 'Sem 1', sgpa: 8.2, cgpa: 8.2 },
  { semester: 'Sem 2', sgpa: 7.8, cgpa: 8.0 },
  { semester: 'Sem 3', sgpa: 8.5, cgpa: 8.17 },
  { semester: 'Sem 4', sgpa: 8.1, cgpa: 8.15 },
  { semester: 'Sem 5', sgpa: 8.7, cgpa: 8.26 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl backdrop-blur-sm p-3 shadow-xl" style={{ background: 'hsl(var(--card))', border: '1px solid var(--divider)' }}>
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-muted-foreground capitalize">{entry.name}:</span>
          <span className="text-xs font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface CGPATrendProps {
  data?: typeof DEMO_DATA
  title?: string
  subtitle?: string
}

export function CGPATrend({ data = DEMO_DATA, title = 'Academic Trend', subtitle = 'SGPA vs CGPA over semesters' }: CGPATrendProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold font-display">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-indigo-400" />
            <span className="text-muted-foreground">SGPA</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded bg-violet-400" />
            <span className="text-muted-foreground">CGPA</span>
          </span>
        </div>
      </div>
      <div className="h-60" role="img" aria-label={`Area chart: ${title}. ${subtitle}. A screen-reader-friendly table of the same data follows.`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="sgpaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
            <XAxis dataKey="semester" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[6, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="sgpa" stroke="#6366f1" strokeWidth={2.5} fill="url(#sgpaGrad)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="cgpa" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#cgpaGrad)" dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Screen-reader-only data table — "insight over time" is the product's whole
          differentiator over a one-off calculator, so it needs a non-visual equivalent.
          `sr-only` goes on a wrapping div, not the table itself: a <table> ignores a
          `width: 1px` override from its own native auto-layout sizing, and since it's
          then absolutely positioned with no positioned ancestor, it escapes GlassCard
          and expands the whole page's horizontal scroll width. A div doesn't have that
          table-layout quirk, and its `overflow: hidden` correctly clips the table
          inside without leaking into the page's scrollable area. */}
      <div className="sr-only">
        <table>
          <caption>{title} — {subtitle}</caption>
          <thead>
            <tr>
              <th scope="col">Semester</th>
              <th scope="col">SGPA</th>
              <th scope="col">CGPA</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.semester}>
                <th scope="row">{d.semester}</th>
                <td>{d.sgpa}</td>
                <td>{d.cgpa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
