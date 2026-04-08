import { useEffect, useRef } from 'react'
import { notificationsApi } from '@/lib/api'
import dayjs from 'dayjs'

const STORAGE_KEY = 'work-os:notified-ids'
const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

function getNotifiedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markNotified(id: string) {
  const ids = getNotifiedIds()
  ids.add(id)
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

async function checkAndNotify() {
  const granted = await requestPermission()
  if (!granted) return

  let items: Awaited<ReturnType<typeof notificationsApi.dueToday>>
  try {
    items = await notificationsApi.dueToday()
  } catch {
    return
  }

  const notified = getNotifiedIds()
  const today = dayjs().format('YYYY-MM-DD')

  for (const item of items) {
    const notifyKey = `${item.id}:${today}`
    if (notified.has(notifyKey)) continue

    const isFollowUp = item.followUpDate && dayjs(item.followUpDate).format('YYYY-MM-DD') === today
    const isDue = item.dueDate && dayjs(item.dueDate).format('YYYY-MM-DD') === today

    const body = isFollowUp
      ? `Follow-up due today`
      : isDue
      ? `Due today`
      : 'Needs attention'

    const n = new Notification(`Personal Work OS: ${item.title}`, {
      body,
      icon: '/icon.svg',
      tag: notifyKey, // prevents duplicate OS notifications
      silent: item.priority === 'low',
    })

    n.onclick = () => {
      window.focus()
      n.close()
    }

    markNotified(notifyKey)
  }
}

export function useFollowUpNotifications() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Initial check after a short delay (let the app load first)
    const initial = setTimeout(() => checkAndNotify(), 3000)

    // Periodic check
    timerRef.current = setInterval(checkAndNotify, CHECK_INTERVAL_MS)

    return () => {
      clearTimeout(initial)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])
}
