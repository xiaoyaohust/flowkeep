import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { WorkItems } from './pages/WorkItems'
import { MeetingNotes } from './pages/MeetingNotes'
import { RecurringTemplates } from './pages/RecurringTemplates'
import { WeeklyReview } from './pages/WeeklyReview'
import { useFollowUpNotifications } from './hooks/use-notifications'

export default function App() {
  useFollowUpNotifications()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/work-items" element={<WorkItems />} />
        <Route path="/meeting-notes" element={<MeetingNotes />} />
        <Route path="/recurring" element={<RecurringTemplates />} />
        <Route path="/weekly-review" element={<WeeklyReview />} />
      </Route>
    </Routes>
  )
}
