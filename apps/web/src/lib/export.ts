import type { WeeklyReviewData, WorkItem } from '@personal-work-os/shared'
import dayjs from 'dayjs'

function fmtDate(iso: string | null | undefined) {
  if (!iso) return ''
  return dayjs(iso).format('MMM D')
}

function itemLine(item: WorkItem): string {
  const parts = [`- **${item.title}**`]
  if (item.owner) parts.push(`(${item.owner})`)
  if (item.dueDate) parts.push(`· due ${fmtDate(item.dueDate)}`)
  if (item.nextStep) parts.push(`\n  → ${item.nextStep}`)
  return parts.join(' ')
}

function section(title: string, items: WorkItem[], emptyMsg = '_None_'): string {
  const lines = [`### ${title}`, '']
  if (items.length === 0) {
    lines.push(emptyMsg)
  } else {
    lines.push(...items.map(itemLine))
  }
  return lines.join('\n')
}

export function generateWeeklyMarkdown(data: WeeklyReviewData): string {
  const start = dayjs(data.weekStart).format('MMM D')
  const end = dayjs(data.weekEnd).format('MMM D, YYYY')

  const lines: string[] = [
    `# Weekly Review: ${start} – ${end}`,
    '',
    `> Generated ${dayjs().format('MMM D, YYYY [at] HH:mm')}`,
    '',
    '## Stats',
    '',
    `| Created | Completed | Waiting | Blocked | Overdue |`,
    `|---------|-----------|---------|---------|---------|`,
    `| ${data.stats.created} | ${data.stats.completed} | ${data.stats.waiting} | ${data.stats.blocked} | ${data.stats.overdue} |`,
    '',
    '---',
    '',
    section('✅ Completed This Week', data.completedThisWeek, '_Nothing completed this week._'),
    '',
    section('🆕 Created This Week', data.createdThisWeek, '_No new items._'),
    '',
    section('⏳ Still Waiting', data.stillWaiting, '_No items waiting on others._'),
    '',
    section('🚫 Still Blocked', data.stillBlocked, '_No blocked items._'),
    '',
    section('⚠️ Overdue', data.overdueOpen, '_Nothing overdue._'),
    '',
    section('📅 Follow Ups Next Week', data.nextWeekFollowUps, '_Nothing scheduled._'),
    '',
  ]

  return lines.join('\n')
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
