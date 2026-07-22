'use client'

import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LookingForTeamStudent } from '@/lib/teamup/api'

export function StudentCard({ student, onInvite }: { student: LookingForTeamStudent; onInvite: () => void }) {
  const initials = (student.profile.fullName ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <GlassCard className="p-5 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{student.profile.fullName ?? 'A student'}</p>
          {student.availability && <p className="text-xs text-muted-foreground truncate">Available: {student.availability}</p>}
        </div>
      </div>

      {student.interests.length > 0 && (
        <div className="mb-2.5">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Looking For</p>
          <div className="flex flex-wrap gap-1.5">
            {student.interests.map(i => <Badge key={i.id} variant="indigo">{i.name}</Badge>)}
          </div>
        </div>
      )}

      {student.skills.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {student.skills.slice(0, 5).map(s => <Badge key={s.id} variant="violet">{s.name}</Badge>)}
          </div>
        </div>
      )}

      {student.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{student.bio}</p>}

      <p className="text-xs text-muted-foreground mb-4">
        {student.experienceLevel ?? 'Experience not specified'}
        {student.competitionsCompleted > 0 ? ` · ${student.competitionsCompleted} competitions` : ''}
      </p>

      <Button variant="gradient" size="sm" className="w-full" onClick={onInvite}>Invite to Team</Button>
    </GlassCard>
  )
}
