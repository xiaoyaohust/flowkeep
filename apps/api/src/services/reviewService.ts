import { prisma } from '../lib/prisma'
import { aggregateWeeklyReview } from '@personal-work-os/shared'
import dayjs from 'dayjs'

function tryParseJson(val: string): string[] {
  try { return JSON.parse(val) } catch { return [] }
}

function formatItem(i: any) {
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

export async function getWeeklyReview(weekStart: string, weekEnd: string) {
  const start = dayjs(weekStart).startOf('day').toDate()
  const end = dayjs(weekEnd).endOf('day').toDate()
  const nextWeekEnd = dayjs(weekEnd).add(7, 'day').endOf('day').toDate()

  const items = await prisma.workItem.findMany({
    where: {
      OR: [
        // Completed this week
        { completedAt: { gte: start, lte: end } },
        // Created this week
        { createdAt: { gte: start, lte: end } },
        // Still open
        { status: { in: ['todo', 'in_progress', 'waiting', 'blocked'] } },
        // Follow up next week
        { followUpDate: { gte: end, lte: nextWeekEnd } },
      ],
    },
    include: { relatedLinks: true },
  })

  const formatted = items.map(formatItem)
  return aggregateWeeklyReview(formatted as any, weekStart, weekEnd)
}
