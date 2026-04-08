import { prisma } from '../lib/prisma'

function tryParseJson(val: string): string[] {
  try { return JSON.parse(val) } catch { return [] }
}

function fmtItem(i: any) {
  return {
    ...i,
    tags: tryParseJson(i.tags ?? '[]'),
    dueDate: i.dueDate?.toISOString() ?? null,
    followUpDate: i.followUpDate?.toISOString() ?? null,
    createdAt: i.createdAt?.toISOString(),
    updatedAt: i.updatedAt?.toISOString(),
    completedAt: i.completedAt?.toISOString() ?? null,
    archivedAt: i.archivedAt?.toISOString() ?? null,
  }
}

function fmtNote(n: any) {
  return {
    id: n.id,
    title: n.title,
    meetingDate: n.meetingDate?.toISOString() ?? null,
    attendees: n.attendees,
    notes: n.notes,
    createdAt: n.createdAt?.toISOString(),
    updatedAt: n.updatedAt?.toISOString(),
    actionItemCount: n._count?.actionLinks ?? 0,
  }
}

export async function globalSearch(q: string) {
  if (!q || q.trim().length < 2) return { workItems: [], meetingNotes: [] }

  const [workItems, meetingNotes] = await Promise.all([
    prisma.workItem.findMany({
      where: {
        status: { not: 'archived' },
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { nextStep: { contains: q } },
          { blocker: { contains: q } },
          { owner: { contains: q } },
          { category: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.meetingNote.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { notes: { contains: q } },
          { attendees: { contains: q } },
        ],
      },
      orderBy: { meetingDate: 'desc' },
      take: 5,
      include: { _count: { select: { actionLinks: true } } },
    }),
  ])

  return {
    workItems: workItems.map(fmtItem),
    meetingNotes: meetingNotes.map(fmtNote),
  }
}
