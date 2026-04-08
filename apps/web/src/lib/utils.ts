import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined, format = 'MMM D, YYYY'): string {
  if (!date) return '—'
  return dayjs(date).format(format)
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  return dayjs(date).fromNow()
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  return dayjs(date).isBefore(dayjs(), 'day')
}

export function isToday(date: string | null | undefined): boolean {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), 'day')
}

export function currentWeekRange(): { start: string; end: string } {
  return {
    start: dayjs().startOf('isoWeek' as any).format('YYYY-MM-DD'),
    end: dayjs().endOf('isoWeek' as any).format('YYYY-MM-DD'),
  }
}
