import dayjs from 'dayjs'
import type { RecurringFrequency } from '../types/common'

export function calculateNextDueDate(
  frequency: RecurringFrequency,
  fromDate: string | Date,
): string {
  const base = dayjs(fromDate)
  switch (frequency) {
    case 'daily':
      return base.add(1, 'day').toISOString()
    case 'weekly':
      return base.add(7, 'day').toISOString()
    case 'biweekly':
      return base.add(14, 'day').toISOString()
    case 'monthly':
      return base.add(1, 'month').toISOString()
  }
}

export function getPeriodStart(frequency: RecurringFrequency, date: string | Date): string {
  const d = dayjs(date)
  switch (frequency) {
    case 'daily':
      return d.startOf('day').toISOString()
    case 'weekly':
      return d.startOf('week').toISOString()
    case 'biweekly':
      return d.startOf('week').toISOString()
    case 'monthly':
      return d.startOf('month').toISOString()
  }
}
