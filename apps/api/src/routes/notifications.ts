import { Router } from 'express'
import { prisma } from '../lib/prisma'
import dayjs from 'dayjs'

const router = Router()

router.get('/due-today', async (_req, res, next) => {
  try {
    const todayStart = dayjs().startOf('day').toDate()
    const todayEnd = dayjs().endOf('day').toDate()

    const items = await prisma.workItem.findMany({
      where: {
        status: { notIn: ['done', 'archived'] },
        OR: [
          { followUpDate: { gte: todayStart, lte: todayEnd } },
          { dueDate: { gte: todayStart, lte: todayEnd } },
        ],
      },
      select: { id: true, title: true, followUpDate: true, dueDate: true, status: true, priority: true },
      orderBy: { priority: 'desc' },
    })

    res.json(
      items.map((i) => ({
        ...i,
        followUpDate: i.followUpDate?.toISOString() ?? null,
        dueDate: i.dueDate?.toISOString() ?? null,
      })),
    )
  } catch (err) {
    next(err)
  }
})

export default router
