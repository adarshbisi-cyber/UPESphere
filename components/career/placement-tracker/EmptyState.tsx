import { Plus, TrendingUp, MapPinned, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'

export function PlacementTrackerEmptyState({ onAddFirst }: { onAddFirst: () => void }) {
  return (
    <GlassCard className="p-10 text-center">
      <h2 className="text-lg font-semibold font-display mb-2">Track Your Placement Journey</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        Keep track of every opportunity, understand your progress, and discover where you can improve.
      </p>
      <Button variant="gradient" className="gap-2 mb-8" onClick={onAddFirst}>
        <Plus className="w-4 h-4" />
        Add Your First Application
      </Button>

      <div className="grid sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
        {[
          { icon: MapPinned, text: 'Track applications and recruitment rounds' },
          { icon: TrendingUp, text: 'Understand where opportunities are dropping off' },
          { icon: Compass, text: 'Discover patterns in your placement journey' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
            <Icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
