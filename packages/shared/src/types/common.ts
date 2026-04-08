export type WorkItemStatus =
  | 'todo'
  | 'in_progress'
  | 'waiting'
  | 'blocked'
  | 'done'
  | 'archived'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type SourceType = 'manual' | 'meeting_note' | 'recurring'

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export const WORK_ITEM_STATUSES: WorkItemStatus[] = [
  'todo',
  'in_progress',
  'waiting',
  'blocked',
  'done',
  'archived',
]

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
]

export const STATUS_LABELS: Record<WorkItemStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  blocked: 'Blocked',
  done: 'Done',
  archived: 'Archived',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
}
