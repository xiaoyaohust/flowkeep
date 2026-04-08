import type { WorkItem } from './workItem'

export interface MeetingNote {
  id: string
  title: string
  meetingDate: string
  attendees: string | null
  notes: string
  createdAt: string
  updatedAt: string
  actionItems?: WorkItem[]
}

export interface CreateMeetingNoteInput {
  title: string
  meetingDate: string
  attendees?: string | null
  notes: string
}

export interface UpdateMeetingNoteInput {
  title?: string
  meetingDate?: string
  attendees?: string | null
  notes?: string
}

export interface CreateActionItemFromNoteInput {
  title: string
  description?: string | null
  owner?: string | null
  dueDate?: string | null
  followUpDate?: string | null
  nextStep?: string | null
  priority?: string
  category?: string | null
}
