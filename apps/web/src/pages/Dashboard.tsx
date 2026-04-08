import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WorkItemRow } from '@/features/work-items/WorkItemRow'
import { WorkItemForm } from '@/features/work-items/WorkItemForm'
import { WorkItemDrawer } from '@/features/work-items/WorkItemDrawer'
import { dashboardApi, workItemsApi } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { WorkItem } from '@personal-work-os/shared'
import dayjs from 'dayjs'

interface GroupProps {
  title: string
  items: WorkItem[]
  defaultOpen?: boolean
  emptyText?: string
  onItemClick: (id: string) => void
  onTagClick?: (tag: string) => void
  variant?: 'default' | 'warning' | 'danger'
}

function GroupSection({ title, items, defaultOpen = true, emptyText, onItemClick, onTagClick, variant = 'default' }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  const countColor = {
    default: 'bg-gray-100 text-gray-600',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  }[variant]

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <span className={cn('text-xs font-semibold rounded-full px-2 py-0.5', countColor)}>
            {items.length}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-white">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{emptyText || 'No items'}</p>
          ) : (
            items.map((item) => (
              <WorkItemRow key={item.id} item={item} onClick={() => onItemClick(item.id)} onTagClick={onTagClick} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function Dashboard() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const navigate = useNavigate()
  const handleTagClick = (tag: string) => navigate(`/work-items?tag=${encodeURIComponent(tag)}`)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.summary,
  })

  const createMut = useMutation({
    mutationFn: workItemsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['work-items'] })
      setCreating(false)
      toast({ title: 'Work item created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Failed to load dashboard. Is the API running on port 3001?
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dayjs().format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Item
          </Button>
        </div>

        {/* Quick stats */}
        {data && (
          <div className="flex gap-4 mt-4">
            <Stat label="Today" value={data.counts.today} variant={data.counts.today > 0 ? 'active' : 'muted'} />
            <Stat label="Waiting" value={data.counts.waiting} variant={data.counts.waiting > 0 ? 'warning' : 'muted'} />
            <Stat label="Blocked" value={data.counts.blocked} variant={data.counts.blocked > 0 ? 'danger' : 'muted'} />
            <Stat label="Overdue" value={data.counts.overdue} variant={data.counts.overdue > 0 ? 'danger' : 'muted'} />
            <Stat label="Follow Up" value={data.counts.followUpThisWeek} variant="muted" />
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4 max-w-4xl">
            <GroupSection title="Today" items={data.today} defaultOpen variant="warning" onItemClick={setSelectedId} onTagClick={handleTagClick} emptyText="Nothing due or scheduled for today" />
            <GroupSection title="Blocked" items={data.blocked} defaultOpen variant="danger" onItemClick={setSelectedId} onTagClick={handleTagClick} emptyText="No blocked items" />
            <GroupSection title="Waiting" items={data.waiting} onItemClick={setSelectedId} onTagClick={handleTagClick} emptyText="No items waiting on others" />
            <GroupSection title="Overdue" items={data.overdue} variant="danger" onItemClick={setSelectedId} onTagClick={handleTagClick} emptyText="Nothing overdue" />
            <GroupSection title="Follow Up This Week" items={data.followUpThisWeek} onItemClick={setSelectedId} onTagClick={handleTagClick} emptyText="No scheduled follow-ups this week" />
            <GroupSection title="Recently Updated" items={data.recentlyUpdated} defaultOpen={false} onItemClick={setSelectedId} onTagClick={handleTagClick} />
          </div>
        ) : null}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Work Item</DialogTitle>
          </DialogHeader>
          <WorkItemForm
            onSubmit={createMut.mutate}
            onCancel={() => setCreating(false)}
            isLoading={createMut.isPending}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <WorkItemDrawer itemId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function Stat({ label, value, variant }: { label: string; value: number; variant: 'active' | 'warning' | 'danger' | 'muted' }) {
  const colors = {
    active: 'text-blue-700 bg-blue-50 border-blue-100',
    warning: 'text-yellow-700 bg-yellow-50 border-yellow-100',
    danger: 'text-red-700 bg-red-50 border-red-100',
    muted: 'text-gray-500 bg-gray-50 border-gray-100',
  }[variant]

  return (
    <div className={cn('flex flex-col items-center px-4 py-2 rounded-lg border text-center min-w-[64px]', colors)}>
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-xs mt-0.5">{label}</span>
    </div>
  )
}
