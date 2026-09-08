'use client'

import { useMemo, useState } from 'react'
import { Search, Plus, Briefcase, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { ApplicationStatusBadge } from './StatusBadge'
import { getApplicationJourneyState } from '@/lib/placementTracker/journey'
import { OPPORTUNITY_TYPES } from '@/lib/placementTracker/constants'
import type { OpportunityType, PlacementApplication } from '@/lib/placementTracker/types'

type ViewFilter = 'all' | 'active' | 'closed' | 'offers'

function matchesView(app: PlacementApplication, view: ViewFilter): boolean {
  if (view === 'all') return true
  if (view === 'active') return app.status === 'active'
  if (view === 'offers') return app.status === 'offer'
  return app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'closed'
}

export function ApplicationsTab({
  applications,
  onAdd,
  onOpen,
  onEdit,
  onDelete,
}: {
  applications: PlacementApplication[]
  onAdd: () => void
  onOpen: (applicationId: string) => void
  onEdit: (app: PlacementApplication) => void
  onDelete: (app: PlacementApplication) => void
}) {
  const [view, setView] = useState<ViewFilter>('all')
  const [search, setSearch] = useState('')
  const [opportunityType, setOpportunityType] = useState<OpportunityType | 'all'>('all')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return applications
      .filter(a => matchesView(a, view))
      .filter(a => opportunityType === 'all' || a.opportunityType === opportunityType)
      .filter(a => !query || a.companyName.toLowerCase().includes(query) || a.role.toLowerCase().includes(query))
  }, [applications, view, search, opportunityType])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={view} onValueChange={v => setView(v as ViewFilter)}>
          <TabsList className="flex-nowrap w-max sm:w-auto h-10">
            <TabsTrigger value="all" className="shrink-0">All</TabsTrigger>
            <TabsTrigger value="active" className="shrink-0">Active</TabsTrigger>
            <TabsTrigger value="closed" className="shrink-0">Closed</TabsTrigger>
            <TabsTrigger value="offers" className="shrink-0">Offers</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="gradient" size="sm" className="gap-1.5 shrink-0" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
          Add Application
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or role" className="pl-9" />
        </div>
        <Select value={opportunityType} onValueChange={v => setOpportunityType(v as OpportunityType | 'all')}>
          <SelectTrigger className="sm:w-44 shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OPPORTUNITY_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {applications.length === 0 ? 'No applications tracked yet.' : 'Nothing matches these filters.'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => (
            <ApplicationRow
              key={app.id}
              app={app}
              onOpen={() => onOpen(app.id)}
              onEdit={() => onEdit(app)}
              onDelete={() => onDelete(app)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// The row is a wrapper div rather than one big button: the actions menu is
// itself a button, and a button nested inside a button is invalid HTML that
// browsers resolve unpredictably. The wrapper carries the hover styling so
// the card still reads as a single surface, while the summary and the menu
// stay two separate, independently focusable controls.
function ApplicationRow({
  app,
  onOpen,
  onEdit,
  onDelete,
}: {
  app: PlacementApplication
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  // One shared derivation, so a closed application can never advertise a
  // "current" round it will never reach.
  const journey = getApplicationJourneyState(app)
  return (
    <div
      className="flex items-center gap-1 pr-2 rounded-xl border border-transparent transition-colors hover:border-indigo-500/30 focus-within:border-indigo-500/30"
      style={{ background: 'var(--muted-surface)' }}
    >
      <button
        onClick={onOpen}
        className="flex-1 min-w-0 text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{app.companyName}</span>
            <ApplicationStatusBadge status={app.status} />
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {app.role}</span>
            {app.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.location}</span>}
            <span>{app.applicationDate}</span>
          </div>
        </div>
        <div className={`text-xs sm:text-right shrink-0 ${journey.phase === 'rejected' || journey.phase === 'withdrawn' ? 'text-red-500/80 dark:text-red-400/80' : journey.phase === 'offer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
          {journey.label}
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${app.companyName}`}
          className="shrink-0 w-10 h-10 rounded-lg inline-flex items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground hover:bg-indigo-500/10 focus-visible:ring-2 focus-visible:ring-indigo-500/50 data-[state=open]:text-foreground data-[state=open]:bg-indigo-500/10"
        >
          <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
            Edit Application
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete Application
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
