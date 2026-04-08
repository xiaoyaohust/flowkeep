import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  RefreshCw,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toaster } from './Toaster'
import { GlobalSearch } from './GlobalSearch'
import { WorkItemDrawer } from '@/features/work-items/WorkItemDrawer'
import dayjs from 'dayjs'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/work-items', label: 'Work Items', icon: ListTodo },
  { to: '/meeting-notes', label: 'Meeting Notes', icon: FileText },
  { to: '/recurring', label: 'Recurring', icon: RefreshCw },
  { to: '/weekly-review', label: 'Weekly Review', icon: BarChart2 },
]

export function Layout() {
  const location = useLocation()
  const [searchSelectedId, setSearchSelectedId] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            Personal Work OS
          </span>
        </div>

        {/* Search */}
        <div className="px-2 py-2 border-b border-gray-100">
          <GlobalSearch onSelectWorkItem={setSearchSelectedId} />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{dayjs().format('ddd, MMM D')}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Global search result drawer */}
      <WorkItemDrawer
        itemId={searchSelectedId}
        onClose={() => setSearchSelectedId(null)}
      />

      <Toaster />
    </div>
  )
}
