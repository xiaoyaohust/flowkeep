import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import type { WorkItem } from '../types/workItem'

dayjs.extend(isoWeek)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const DONE_STATUSES = new Set(['done', 'archived'])

export interface DashboardGroups {
  today: WorkItem[]
  waiting: WorkItem[]
  blocked: WorkItem[]
  followUpThisWeek: WorkItem[]
  overdue: WorkItem[]
  recentlyUpdated: WorkItem[]
}

export function groupForDashboard(items: WorkItem[]): DashboardGroups {
  const now = dayjs()
  const todayStr = now.format('YYYY-MM-DD')
  const weekStart = now.startOf('isoWeek')
  const weekEnd = now.endOf('isoWeek')

  const active = items.filter((i) => !DONE_STATUSES.has(i.status))

  const today = active.filter((i) => {
    const due = i.dueDate ? dayjs(i.dueDate).format('YYYY-MM-DD') : null
    const followUp = i.followUpDate ? dayjs(i.followUpDate).format('YYYY-MM-DD') : null
    return due === todayStr || followUp === todayStr
  })

  const waiting = items.filter((i) => i.status === 'waiting')

  const blocked = items.filter((i) => i.status === 'blocked')

  const followUpThisWeek = active.filter((i) => {
    if (!i.followUpDate) return false
    const f = dayjs(i.followUpDate)
    const fStr = f.format('YYYY-MM-DD')
    // exclude today (already in today group)
    if (fStr === todayStr) return false
    return f.isSameOrAfter(weekStart, 'day') && f.isSameOrBefore(weekEnd, 'day')
  })

  const overdue = active.filter((i) => {
    if (!i.dueDate) return false
    return dayjs(i.dueDate).isBefore(now, 'day')
  })

  const recentlyUpdated = [...items]
    .filter((i) => i.status !== 'archived')
    .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
    .slice(0, 10)

  return { today, waiting, blocked, followUpThisWeek, overdue, recentlyUpdated }
}
