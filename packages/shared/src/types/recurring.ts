import type { RecurringFrequency } from './common'
import type { WorkItem } from './workItem'

export interface RecurringTemplate {
  id: string
  title: string
  description: string | null
  frequency: RecurringFrequency
  category: string | null
  tags: string[]
  isActive: boolean
  nextDueDate: string | null
  createdAt: string
  updatedAt: string
  instances?: WorkItem[]
}

export interface CreateRecurringTemplateInput {
  title: string
  description?: string | null
  frequency: RecurringFrequency
  category?: string | null
  tags?: string[]
  nextDueDate?: string | null
}

export interface UpdateRecurringTemplateInput {
  title?: string
  description?: string | null
  frequency?: RecurringFrequency
  category?: string | null
  tags?: string[]
  isActive?: boolean
  nextDueDate?: string | null
}
