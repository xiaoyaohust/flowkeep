import { prisma } from '../lib/prisma'
import { NotFoundError } from '../middleware/errorHandler'
import type {
  CreateMeetingNoteSchema,
  UpdateMeetingNoteSchema,
  CreateActionItemFromNoteSchema,
} from '@personal-work-os/shared'

function formatNote(note: any) {
  return {
    ...note,
    meetingDate: note.meetingDate instanceof Date ? note.meetingDate.toISOString() : note.meetingDate,
    createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
    updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
    actionItems: note.actionLinks?.map((link: any) => ({
      ...link.workItem,
      tags: tryParseJson(link.workItem?.tags ?? '[]'),
      dueDate: link.workItem?.dueDate?.toISOString() ?? null,
      followUpDate: link.workItem?.followUpDate?.toISOString() ?? null,
      createdAt: link.workItem?.createdAt?.toISOString(),
      updatedAt: link.workItem?.updatedAt?.toISOString(),
      completedAt: link.workItem?.completedAt?.toISOString() ?? null,
      archivedAt: link.workItem?.archivedAt?.toISOString() ?? null,
    })),
  }
}

function tryParseJson(val: string): string[] {
  try { return JSON.parse(val) } catch { return [] }
}

const noteInclude = {
  actionLinks: {
    include: { workItem: { include: { relatedLinks: true } } },
  },
}

export async function listMeetingNotes(search?: string) {
  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { notes: { contains: search } },
          { attendees: { contains: search } },
        ],
      }
    : undefined

  const notes = await prisma.meetingNote.findMany({
    where,
    orderBy: { meetingDate: 'desc' },
    include: noteInclude,
  })
  return notes.map(formatNote)
}

export async function getMeetingNote(id: string) {
  const note = await prisma.meetingNote.findUnique({ where: { id }, include: noteInclude })
  if (!note) throw new NotFoundError('Meeting note')
  return formatNote(note)
}

export async function createMeetingNote(data: CreateMeetingNoteSchema) {
  const note = await prisma.meetingNote.create({
    data: {
      ...data,
      meetingDate: new Date(data.meetingDate),
    },
    include: noteInclude,
  })
  return formatNote(note)
}

export async function updateMeetingNote(id: string, data: UpdateMeetingNoteSchema) {
  const existing = await prisma.meetingNote.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Meeting note')

  const note = await prisma.meetingNote.update({
    where: { id },
    data: {
      ...data,
      meetingDate: data.meetingDate ? new Date(data.meetingDate) : undefined,
    },
    include: noteInclude,
  })
  return formatNote(note)
}

export async function deleteMeetingNote(id: string) {
  const existing = await prisma.meetingNote.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Meeting note')
  await prisma.meetingNote.delete({ where: { id } })
}

export async function createActionItemFromNote(
  noteId: string,
  data: CreateActionItemFromNoteSchema,
) {
  const note = await prisma.meetingNote.findUnique({ where: { id: noteId } })
  if (!note) throw new NotFoundError('Meeting note')

  const description = [
    data.description,
    `\n---\n*From meeting: ${note.title} (${new Date(note.meetingDate).toLocaleDateString()})*`,
  ]
    .filter(Boolean)
    .join('\n')

  const workItem = await prisma.workItem.create({
    data: {
      title: data.title,
      description,
      owner: data.owner ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      nextStep: data.nextStep ?? null,
      priority: data.priority ?? 'medium',
      category: data.category ?? null,
      status: 'todo',
      sourceType: 'meeting_note',
      tags: '[]',
    },
    include: { relatedLinks: true },
  })

  await prisma.meetingNoteActionLink.create({
    data: { meetingNoteId: noteId, workItemId: workItem.id },
  })

  return {
    ...workItem,
    tags: [],
    dueDate: workItem.dueDate?.toISOString() ?? null,
    followUpDate: workItem.followUpDate?.toISOString() ?? null,
    createdAt: workItem.createdAt.toISOString(),
    updatedAt: workItem.updatedAt.toISOString(),
    completedAt: null,
    archivedAt: null,
  }
}
