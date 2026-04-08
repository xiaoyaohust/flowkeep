import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import type { WorkItem } from '../types/workItem'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

export interface WeeklyReviewData {
  weekStart: string
  weekEnd: string
  completedThisWeek: WorkItem[]
  createdThisWeek: WorkItem[]
  stillWaiting: WorkItem[]
  stillBlocked: WorkItem[]
  overdueOpen: WorkItem[]
  nextWeekFollowUps: WorkItem[]
  stats: {
    created: number
    completed: number
    waiting: number
    blocked: number
    overdue: number
  }
}

export function aggregateWeeklyReview(
  items: WorkItem[],
  weekStart: string,
  weekEnd: string,
): WeeklyReviewData {
  const start = dayjs(weekStart)
  const end = dayjs(weekEnd)
  const nextWeekStart = end.add(1, 'day')
  const nextWeekEnd = nextWeekStart.add(6, 'day')

  const inRange = (date: string | null, from: dayjs.Dayjs, to: dayjs.Dayjs) => {
    if (!date) return false
    const d = dayjs(date)
    return d.isSameOrAfter(from, 'day') && d.isSameOrBefore(to, 'day')
  }

  const completedThisWeek = items.filter(
    (i) => i.completedAt && inRange(i.completedAt, start, end),
  )

  const createdThisWeek = items.filter((i) => inRange(i.createdAt, start, end))

  const stillWaiting = items.filter((i) => i.status === 'waiting')

  const stillBlocked = items.filter((i) => i.status === 'blocked')

  const overdueOpen = items.filter(
    (i) =>
      i.dueDate &&
      dayjs(i.dueDate).isBefore(end, 'day') &&
      !['done', 'archived'].includes(i.status),
  )

  const nextWeekFollowUps = items.filter(
    (i) =>
      i.followUpDate &&
      inRange(i.followUpDate, nextWeekStart, nextWeekEnd) &&
      !['done', 'archived'].includes(i.status),
  )

  return {
    weekStart,
    weekEnd,
    completedThisWeek,
    createdThisWeek,
    stillWaiting,
    stillBlocked,
    overdueOpen,
    nextWeekFollowUps,
    stats: {
      created: createdThisWeek.length,
      completed: completedThisWeek.length,
      waiting: stillWaiting.length,
      blocked: stillBlocked.length,
      overdue: overdueOpen.length,
    },
  }
}
