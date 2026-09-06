'use client'

// Top-level Resources page: fetches the published catalogue once and
// filters it in memory (search + category — see lib/careerResources/filter.ts),
// same "fetch once, filter client-side" convention as Placement Tracker's
// ApplicationsTab and TeamUp's filterTeams/filterStudents. Keeps
// loading/error/empty/no-results states visually distinct throughout —
// a fetch failure must never look like "no resources exist yet".

import { useEffect, useState } from 'react'
import { Search as SearchIcon, AlertTriangle, Library } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResourceCard } from './ResourceCard'
import { getPublishedResources } from '@/lib/careerResources/api'
import { deriveCategories, filterResources } from '@/lib/careerResources/filter'
import { ALL_CATEGORIES_FILTER } from '@/lib/careerResources/constants'
import type { CareerResource } from '@/lib/careerResources/types'

type Status = 'loading' | 'ready' | 'error'

export function ResourcesLibrary() {
  const [resources, setResources] = useState<CareerResource[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES_FILTER)

  const refresh = () => {
    setStatus('loading')
    getPublishedResources()
      .then(r => { setResources(r); setStatus('ready') })
      .catch(() => setStatus('error'))
  }

  useEffect(() => { refresh() }, [])

  if (status === 'error') {
    return (
      <GlassCard className="p-10 text-center">
        <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">Couldn&rsquo;t load resources.</p>
        <button onClick={refresh} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Try again
        </button>
      </GlassCard>
    )
  }

  if (status === 'loading') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading resources">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'var(--muted-surface)' }} />
        ))}
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <Library className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold font-display mb-2">No resources available yet.</h3>
        <p className="text-sm text-muted-foreground">We&rsquo;re working on adding useful resources for your career journey.</p>
      </GlassCard>
    )
  }

  const categories = deriveCategories(resources)
  const filtered = filterResources(resources, { search, category })

  return (
    <div className="space-y-5">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search resources by title, category, or tag"
          className="pl-9 max-w-md"
        />
      </div>

      <div className="overflow-x-auto">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-nowrap w-max h-10">
            {categories.map(c => (
              <TabsTrigger key={c} value={c} className="shrink-0">{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm font-medium text-foreground mb-1">No matching resources found.</p>
          <p className="text-sm text-muted-foreground">Try another search term or category.</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}
    </div>
  )
}
