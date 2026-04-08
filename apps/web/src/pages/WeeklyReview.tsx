import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkItemRow } from '@/features/work-items/WorkItemRow'
import { WorkItemDrawer } from '@/features/work-items/WorkItemDrawer'
import { reviewsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { generateWeeklyMarkdown, downloadMarkdown } from '@/lib/export'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { WorkItem } from '@personal-work-os/shared'

dayjs.extend(isoWeek)

function getWeekRange(offset: number) {
  const base = dayjs().add(offset, 'week')
  return {
    start: base.startOf('isoWeek' as any).format('YYYY-MM-DD'),
    end: base.endOf('isoWeek' as any).format('YYYY-MM-DD'),
  }
}

interface SectionProps {
  title: string
  items: WorkItem[]
  emptyText: string
  onItemClick: (id: string) => void
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

function ReviewSection({ title, items, emptyText, onItemClick, variant = 'default' }: SectionProps) {
  const colors = {
    default: 'text-gray-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
  }[variant]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <h3 className={cn('text-sm font-semibold', colors)}>{title}</h3>
        <span className="text-xs text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        items.map((item) => (
          <WorkItemRow key={item.id} item={item} onClick={() => onItemClick(item.id)} />
        ))
      )}
    </div>
  )
}

export function WeeklyReview() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { start, end } = getWeekRange(weekOffset)

  const { data, isLoading, error } = useQuery({
    queryKey: ['weekly-review', start, end],
    queryFn: () => reviewsApi.weekly(start, end),
  })

  const weekLabel =
    weekOffset === 0
      ? 'This Week'
      : weekOffset === -1
      ? 'Last Week'
      : `${dayjs(start).format('MMM D')} – ${dayjs(end).format('MMM D')}`

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Weekly Review</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dayjs(start).format('MMM D')} – {dayjs(end).format('MMM D, YYYY')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(o => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[96px] text-center">{weekLabel}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(o => o + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-xs">
                Today
              </Button>
            )}
            {data && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const md = generateWeeklyMarkdown(data)
                  const filename = `weekly-review-${start}.md`
                  downloadMarkdown(md, filename)
                }}
                className="ml-2 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export MD
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="flex gap-3 mt-4 flex-wrap">
            <StatCard label="Created" value={data.stats.created} color="gray" />
            <StatCard label="Completed" value={data.stats.completed} color="green" />
            <StatCard label="Waiting" value={data.stats.waiting} color="yellow" />
            <StatCard label="Blocked" value={data.stats.blocked} color="red" />
            <StatCard label="Overdue" value={data.stats.overdue} color="red" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 p-4">Failed to load review data.</div>
        ) : data ? (
          <div className="space-y-4 max-w-4xl">
            <ReviewSection
              title="Completed This Week"
              items={data.completedThisWeek}
              emptyText="Nothing completed this week yet."
              onItemClick={setSelectedId}
              variant="success"
            />
            <ReviewSection
              title="Created This Week"
              items={data.createdThisWeek}
              emptyText="No new items created this week."
              onItemClick={setSelectedId}
            />
            <ReviewSection
              title="Still Waiting"
              items={data.stillWaiting}
              emptyText="No items waiting on others."
              onItemClick={setSelectedId}
              variant="warning"
            />
            <ReviewSection
              title="Still Blocked"
              items={data.stillBlocked}
              emptyText="No blocked items."
              onItemClick={setSelectedId}
              variant="danger"
            />
            <ReviewSection
              title="Overdue Open Items"
              items={data.overdueOpen}
              emptyText="No overdue items."
              onItemClick={setSelectedId}
              variant="danger"
            />
            <ReviewSection
              title="Follow Ups Next Week"
              items={data.nextWeekFollowUps}
              emptyText="Nothing scheduled for next week yet."
              onItemClick={setSelectedId}
            />
          </div>
        ) : null}
      </div>

      <WorkItemDrawer itemId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const styles: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }
  return (
    <div className={cn('border rounded-lg px-4 py-2 text-center min-w-[72px]', styles[color] ?? styles.gray)}>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-xs mt-0.5">{label}</div>
    </div>
  )
}
