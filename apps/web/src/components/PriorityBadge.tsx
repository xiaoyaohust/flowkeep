import { cn } from '@/lib/utils'
import type { Priority } from '@personal-work-os/shared'

const priorityConfig: Record<Priority, { label: string; dot: string }> = {
  low: { label: 'Low', dot: 'bg-gray-400' },
  medium: { label: 'Medium', dot: 'bg-blue-500' },
  high: { label: 'High', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', dot: 'bg-red-600' },
}

interface Props {
  priority: Priority
  className?: string
  showLabel?: boolean
}

export function PriorityBadge({ priority, className, showLabel = true }: Props) {
  const config = priorityConfig[priority] ?? priorityConfig.medium
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', config.dot)} />
      {showLabel && config.label}
    </span>
  )
}
