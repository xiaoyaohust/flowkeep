import { Router } from 'express'
import {
  createRecurringTemplateSchema,
  updateRecurringTemplateSchema,
} from '@personal-work-os/shared'
import * as svc from '../services/recurringService'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json(await svc.listRecurringTemplates())
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const data = createRecurringTemplateSchema.parse(req.body)
    res.status(201).json(await svc.createRecurringTemplate(data))
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await svc.getRecurringTemplate(req.params.id))
  } catch (err) { next(err) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateRecurringTemplateSchema.parse(req.body)
    res.json(await svc.updateRecurringTemplate(req.params.id, data))
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteRecurringTemplate(req.params.id)
    res.status(204).end()
  } catch (err) { next(err) }
})

router.post('/:id/generate', async (req, res, next) => {
  try {
    res.status(201).json(await svc.generateRecurringInstance(req.params.id))
  } catch (err) { next(err) }
})

router.get('/:id/instances', async (req, res, next) => {
  try {
    res.json(await svc.getTemplateInstances(req.params.id))
  } catch (err) { next(err) }
})

export default router
