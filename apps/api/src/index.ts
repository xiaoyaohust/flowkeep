import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import workItemsRouter from './routes/workItems'
import meetingNotesRouter from './routes/meetingNotes'
import recurringRouter from './routes/recurringTemplates'
import dashboardRouter from './routes/dashboard'
import reviewsRouter from './routes/reviews'
import searchRouter from './routes/search'
import notificationsRouter from './routes/notifications'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/work-items', workItemsRouter)
app.use('/api/meeting-notes', meetingNotesRouter)
app.use('/api/recurring-templates', recurringRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/search', searchRouter)
app.use('/api/notifications', notificationsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
