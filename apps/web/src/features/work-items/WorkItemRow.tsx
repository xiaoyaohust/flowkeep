import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { formatDate, isOverdue, isToday } from '@/lib/utils'
import type { WorkItem } from '@personal-work-os/shared'
import { cn } from '@/lib/utils'

interface Props {
  item: WorkItem
  onClick: () => void
  onTagClick?: (tag: string) => void
}

export function WorkItemRow({ item, onClick, onTagClick }: Props) {
  const overdue = isOverdue(item.dueDate) && !['done', 'archived'].includes(item.status)
  const todayDue = isToday(item.dueDate)

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors group"
    >
      {/* Status icon */}
      <div className="flex-shrink-0 mt-0.5">
        {item.status === 'done' ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : item.status === 'blocked' ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : item.status === 'waiting' ? (
          <Clock className="h-4 w-4 text-yellow-500" />
        ) : (
          <div className={cn(
            'h-4 w-4 rounded-full border-2',
            item.status === 'in_progress' ? 'border-blue-500 bg-blue-100' : 'border-gray-300',
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium text-gray-800 leading-snug group-hover:text-gray-900',
            item.status === 'done' && 'line-through text-gray-400',
          )}>
            {item.title}
          </p>
          <PriorityBadge priority={item.priority as any} showLabel={false} className="flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <StatusBadge status={item.status as any} />
          {item.owner && (
            <span className="text-xs text-muted-foreground">{item.owner}</span>
          )}
          {item.category && (
            <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">
              {item.category}
            </span>
          )}
          {item.dueDate && (
            <span className={cn(
              'text-xs',
              overdue ? 'text-red-600 font-medium' : todayDue ? 'text-orange-600 font-medium' : 'text-muted-foreground',
            )}>
              {overdue ? '⚠ ' : ''}Due {formatDate(item.dueDate, 'MMM D')}
            </span>
          )}
          {item.nextStep && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              → {item.nextStep}
            </span>
          )}
        </div>

        {/* Clickable tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick?.(tag)
                }}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs text-gray-500 bg-gray-100',
                  onTagClick && 'cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors',
                )}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
