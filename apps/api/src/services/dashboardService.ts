import { prisma } from '../lib/prisma'
import { groupForDashboard } from '@personal-work-os/shared'

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

export async function getDashboardSummary() {
  const items = await prisma.workItem.findMany({
    where: { status: { not: 'archived' } },
    include: { relatedLinks: true },
    orderBy: { updatedAt: 'desc' },
  })

  const formatted = items.map(formatItem)
  const groups = groupForDashboard(formatted as any)

  return {
    today: groups.today,
    waiting: groups.waiting,
    blocked: groups.blocked,
    followUpThisWeek: groups.followUpThisWeek,
    overdue: groups.overdue,
    recentlyUpdated: groups.recentlyUpdated,
    counts: {
      today: groups.today.length,
      waiting: groups.waiting.length,
      blocked: groups.blocked.length,
      followUpThisWeek: groups.followUpThisWeek.length,
      overdue: groups.overdue.length,
    },
  }
}
