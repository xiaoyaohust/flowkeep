import { z } from 'zod'

export const relatedLinkInputSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('Invalid URL'),
  title: z.string().nullable().optional(),
})

export const createWorkItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().nullable().optional(),
  status: z
    .enum(['todo', 'in_progress', 'waiting', 'blocked', 'done', 'archived'])
    .optional()
    .default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  owner: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  blocker: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  sourceType: z.enum(['manual', 'meeting_note', 'recurring']).optional().default('manual'),
  recurringTemplateId: z.string().nullable().optional(),
  relatedLinks: z.array(relatedLinkInputSchema).optional().default([]),
})

export const updateWorkItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  status: z
    .enum(['todo', 'in_progress', 'waiting', 'blocked', 'done', 'archived'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  owner: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  blocker: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  relatedLinks: z.array(relatedLinkInputSchema).optional(),
})

export type CreateWorkItemSchema = z.infer<typeof createWorkItemSchema>
export type UpdateWorkItemSchema = z.infer<typeof updateWorkItemSchema>
