import { z } from 'zod'

export const createRecurringTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  nextDueDate: z.string().nullable().optional(),
})

export const updateRecurringTemplateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  nextDueDate: z.string().nullable().optional(),
})

export type CreateRecurringTemplateSchema = z.infer<typeof createRecurringTemplateSchema>
export type UpdateRecurringTemplateSchema = z.infer<typeof updateRecurringTemplateSchema>
