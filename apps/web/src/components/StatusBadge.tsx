import { cn } from '@/lib/utils'
import type { WorkItemStatus } from '@personal-work-os/shared'

const statusConfig: Record<WorkItemStatus, { label: string; className: string }> = {
  todo: { label: 'Todo', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  waiting: { label: 'Waiting', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  blocked: { label: 'Blocked', className: 'bg-red-50 text-red-700 border-red-200' },
  done: { label: 'Done', className: 'bg-green-50 text-green-700 border-green-200' },
  archived: { label: 'Archived', className: 'bg-gray-50 text-gray-400 border-gray-100' },
}

interface Props {
  status: WorkItemStatus
  className?: string
}

export function StatusBadge({ status, className }: Props) {
  const config = statusConfig[status] ?? statusConfig.todo
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
