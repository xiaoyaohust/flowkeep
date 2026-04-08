import { Router } from 'express'
import dayjs from 'dayjs'
import { getWeeklyReview } from '../services/reviewService'

const router = Router()

router.get('/weekly', async (req, res, next) => {
  try {
    const { start, end } = req.query

    // Default: current week Mon–Sun
    const weekStart = start
      ? String(start)
      : dayjs().startOf('isoWeek' as any).format('YYYY-MM-DD')
    const weekEnd = end
      ? String(end)
      : dayjs().endOf('isoWeek' as any).format('YYYY-MM-DD')

    res.json(await getWeeklyReview(weekStart, weekEnd))
  } catch (err) { next(err) }
})

export default router
