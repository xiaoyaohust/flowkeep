import type { Priority, SourceType, WorkItemStatus } from './common'

export interface RelatedLink {
  id: string
  workItemId: string
  url: string
  title: string | null
  createdAt: string
}

export interface WorkItemHistory {
  id: string
  workItemId: string
  field: string
  oldValue: string | null
  newValue: string | null
  changedAt: string
}

export interface WorkItem {
  id: string
  title: string
  description: string | null
  status: WorkItemStatus
  priority: Priority
  owner: string | null
  dueDate: string | null
  followUpDate: string | null
  nextStep: string | null
  blocker: string | null
  category: string | null
  tags: string[]
  sourceType: SourceType
  recurringTemplateId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  archivedAt: string | null
  relatedLinks?: RelatedLink[]
  history?: WorkItemHistory[]
}

export interface CreateWorkItemInput {
  title: string
  description?: string | null
  status?: WorkItemStatus
  priority?: Priority
  owner?: string | null
  dueDate?: string | null
  followUpDate?: string | null
  nextStep?: string | null
  blocker?: string | null
  category?: string | null
  tags?: string[]
  sourceType?: SourceType
  recurringTemplateId?: string | null
  relatedLinks?: { url: string; title?: string | null }[]
}

export interface UpdateWorkItemInput {
  title?: string
  description?: string | null
  status?: WorkItemStatus
  priority?: Priority
  owner?: string | null
  dueDate?: string | null
  followUpDate?: string | null
  nextStep?: string | null
  blocker?: string | null
  category?: string | null
  tags?: string[]
  relatedLinks?: { id?: string; url: string; title?: string | null }[]
}
