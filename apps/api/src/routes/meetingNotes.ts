import { Router } from 'express'
import {
  createMeetingNoteSchema,
  updateMeetingNoteSchema,
  createActionItemFromNoteSchema,
} from '@personal-work-os/shared'
import * as svc from '../services/meetingNoteService'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    res.json(await svc.listMeetingNotes(req.query.search as string | undefined))
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const data = createMeetingNoteSchema.parse(req.body)
    res.status(201).json(await svc.createMeetingNote(data))
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await svc.getMeetingNote(req.params.id))
  } catch (err) { next(err) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateMeetingNoteSchema.parse(req.body)
    res.json(await svc.updateMeetingNote(req.params.id, data))
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteMeetingNote(req.params.id)
    res.status(204).end()
  } catch (err) { next(err) }
})

router.post('/:id/create-action-item', async (req, res, next) => {
  try {
    const data = createActionItemFromNoteSchema.parse(req.body)
    res.status(201).json(await svc.createActionItemFromNote(req.params.id, data))
  } catch (err) { next(err) }
})

export default router
