import { z } from 'zod'

export const createMeetingNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  meetingDate: z.string().min(1, 'Meeting date is required'),
  attendees: z.string().nullable().optional(),
  notes: z.string().min(1, 'Notes are required'),
})

export const updateMeetingNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  meetingDate: z.string().optional(),
  attendees: z.string().nullable().optional(),
  notes: z.string().optional(),
})

export const createActionItemFromNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  category: z.string().nullable().optional(),
})

export type CreateMeetingNoteSchema = z.infer<typeof createMeetingNoteSchema>
export type UpdateMeetingNoteSchema = z.infer<typeof updateMeetingNoteSchema>
export type CreateActionItemFromNoteSchema = z.infer<typeof createActionItemFromNoteSchema>
