import { Router } from 'express'
import { globalSearch } from '../services/searchService'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q as string) ?? ''
    res.json(await globalSearch(q))
  } catch (err) { next(err) }
})

export default router
