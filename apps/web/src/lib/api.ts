import axios from 'axios'
import type {
  WorkItem,
  MeetingNote,
  RecurringTemplate,
  CreateWorkItemSchema,
  UpdateWorkItemSchema,
  CreateMeetingNoteSchema,
  UpdateMeetingNoteSchema,
  CreateActionItemFromNoteSchema,
  CreateRecurringTemplateSchema,
  UpdateRecurringTemplateSchema,
  WeeklyReviewData,
  DashboardGroups,
} from '@personal-work-os/shared'

const http = axios.create({ baseURL: '/api' })

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Unknown error'
    return Promise.reject(new Error(msg))
  },
)

// ---- Work Items ----
export interface ListWorkItemsParams {
  status?: string
  category?: string
  priority?: string
  search?: string
  tag?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface SearchResult {
  workItems: WorkItem[]
  meetingNotes: {
    id: string
    title: string
    meetingDate: string | null
    attendees: string | null
    notes: string
    createdAt: string
    updatedAt: string
    actionItemCount: number
  }[]
}

export interface DueItem {
  id: string
  title: string
  followUpDate: string | null
  dueDate: string | null
  status: string
  priority: string
}

export const workItemsApi = {
  list: (params?: ListWorkItemsParams) =>
    http.get<WorkItem[]>('/work-items', { params }).then((r) => r.data),
  get: (id: string) => http.get<WorkItem>(`/work-items/${id}`).then((r) => r.data),
  create: (data: CreateWorkItemSchema) =>
    http.post<WorkItem>('/work-items', data).then((r) => r.data),
  update: (id: string, data: UpdateWorkItemSchema) =>
    http.patch<WorkItem>(`/work-items/${id}`, data).then((r) => r.data),
  delete: (id: string) => http.delete(`/work-items/${id}`),
  archive: (id: string) => http.post<WorkItem>(`/work-items/${id}/archive`).then((r) => r.data),
  complete: (id: string) => http.post<WorkItem>(`/work-items/${id}/complete`).then((r) => r.data),
}

// ---- Meeting Notes ----
export const meetingNotesApi = {
  list: (search?: string) =>
    http.get<MeetingNote[]>('/meeting-notes', { params: search ? { search } : undefined }).then((r) => r.data),
  get: (id: string) => http.get<MeetingNote>(`/meeting-notes/${id}`).then((r) => r.data),
  create: (data: CreateMeetingNoteSchema) =>
    http.post<MeetingNote>('/meeting-notes', data).then((r) => r.data),
  update: (id: string, data: UpdateMeetingNoteSchema) =>
    http.patch<MeetingNote>(`/meeting-notes/${id}`, data).then((r) => r.data),
  delete: (id: string) => http.delete(`/meeting-notes/${id}`),
  createActionItem: (id: string, data: CreateActionItemFromNoteSchema) =>
    http.post<WorkItem>(`/meeting-notes/${id}/create-action-item`, data).then((r) => r.data),
}

// ---- Recurring Templates ----
export const recurringApi = {
  list: () => http.get<RecurringTemplate[]>('/recurring-templates').then((r) => r.data),
  get: (id: string) =>
    http.get<RecurringTemplate>(`/recurring-templates/${id}`).then((r) => r.data),
  create: (data: CreateRecurringTemplateSchema) =>
    http.post<RecurringTemplate>('/recurring-templates', data).then((r) => r.data),
  update: (id: string, data: UpdateRecurringTemplateSchema) =>
    http.patch<RecurringTemplate>(`/recurring-templates/${id}`, data).then((r) => r.data),
  delete: (id: string) => http.delete(`/recurring-templates/${id}`),
  generate: (id: string) =>
    http.post<WorkItem>(`/recurring-templates/${id}/generate`).then((r) => r.data),
  instances: (id: string) =>
    http.get<WorkItem[]>(`/recurring-templates/${id}/instances`).then((r) => r.data),
}

// ---- Dashboard ----
export interface DashboardSummary extends DashboardGroups {
  counts: Record<string, number>
}

export const dashboardApi = {
  summary: () => http.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
}

// ---- Reviews ----
export const reviewsApi = {
  weekly: (start: string, end: string) =>
    http.get<WeeklyReviewData>('/reviews/weekly', { params: { start, end } }).then((r) => r.data),
}

// ---- Search ----
export const searchApi = {
  global: (q: string) => http.get<SearchResult>('/search', { params: { q } }).then((r) => r.data),
}

// ---- Notifications ----
export const notificationsApi = {
  dueToday: () => http.get<DueItem[]>('/notifications/due-today').then((r) => r.data),
}
