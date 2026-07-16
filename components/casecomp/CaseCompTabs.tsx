'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CaseCompExperience } from '@/components/casecomp/CaseCompExperience'
import { CaseCompDatabase } from '@/components/casecomp/CaseCompDatabase'

type View = 'fest' | 'db'

export function CaseCompTabs() {
  const [view, setView] = useState<View>('fest')

  const tab = (id: View, label: string, Icon: typeof Map) => {
    const active = view === id
    return (
      <button
        onClick={() => setView(id)}
        className={cn(
          'relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors z-10',
          active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {active && (
          <motion.span
            layoutId="casecomp-tab"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 -z-10"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <Icon className="w-4 h-4" />
        {label}
      </button>
    )
  }

  return (
    <div className="pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="inline-flex p-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          {tab('fest', 'Fest Map', Map)}
          {tab('db', 'Global Database', Database)}
        </div>
      </div>

      {view === 'fest' ? <CaseCompExperience /> : <CaseCompDatabase />}
    </div>
  )
}
