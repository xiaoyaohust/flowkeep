import { Router } from 'express'
import { createWorkItemSchema, updateWorkItemSchema } from '@personal-work-os/shared'
import * as svc from '../services/workItemService'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { status, category, priority, search, tag, sortBy, order } = req.query
    const items = await svc.listWorkItems({
      status: status as string,
      category: category as string,
      priority: priority as string,
      search: search as string,
      tag: tag as string,
      sortBy: sortBy as string,
      order: order as 'asc' | 'desc',
    })
    res.json(items)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const data = createWorkItemSchema.parse(req.body)
    const item = await svc.createWorkItem(data)
    res.status(201).json(item)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const item = await svc.getWorkItem(req.params.id)
    res.json(item)
  } catch (err) { next(err) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateWorkItemSchema.parse(req.body)
    const item = await svc.updateWorkItem(req.params.id, data)
    res.json(item)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteWorkItem(req.params.id)
    res.status(204).end()
  } catch (err) { next(err) }
})

router.post('/:id/archive', async (req, res, next) => {
  try {
    const item = await svc.archiveWorkItem(req.params.id)
    res.json(item)
  } catch (err) { next(err) }
})

router.post('/:id/complete', async (req, res, next) => {
  try {
    const item = await svc.completeWorkItem(req.params.id)
    res.json(item)
  } catch (err) { next(err) }
})

export default router
