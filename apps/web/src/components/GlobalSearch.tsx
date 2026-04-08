import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, ListTodo, X } from 'lucide-react'
import { searchApi } from '@/lib/api'
import { StatusBadge } from './StatusBadge'
import { formatDate, cn } from '@/lib/utils'

interface Props {
  onSelectWorkItem: (id: string) => void
}

export function GlobalSearch({ onSelectWorkItem }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQ('')
  }, [open])

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', q],
    queryFn: () => searchApi.global(q),
    enabled: q.trim().length >= 2,
    staleTime: 5000,
  })

  const hasResults =
    data && (data.workItems.length > 0 || data.meetingNotes.length > 0)
  const searched = q.trim().length >= 2

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
        title="Search (⌘K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] text-gray-300 font-mono">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search work items, meeting notes..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          {isFetching && (
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
          )}
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!searched ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              Type at least 2 characters to search
            </p>
          ) : !hasResults && !isFetching ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              No results for "{q}"
            </p>
          ) : (
            <>
              {data && data.workItems.length > 0 && (
                <section>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5" /> Work Items
                      <span className="font-normal normal-case text-gray-400">({data.workItems.length})</span>
                    </p>
                  </div>
                  {data.workItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectWorkItem(item.id)
                        setOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge status={item.status as any} />
                            {item.category && (
                              <span className="text-xs text-gray-400">{item.category}</span>
                            )}
                            {item.dueDate && (
                              <span className="text-xs text-gray-400">Due {formatDate(item.dueDate, 'MMM D')}</span>
                            )}
                          </div>
                        </div>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 flex-shrink-0">
                            {item.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {data && data.meetingNotes.length > 0 && (
                <section>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Meeting Notes
                      <span className="font-normal normal-case text-gray-400">({data.meetingNotes.length})</span>
                    </p>
                  </div>
                  {data.meetingNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => {
                        navigate('/meeting-notes')
                        setOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800 truncate">{note.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {formatDate(note.meetingDate)}
                        </span>
                        {note.actionItemCount > 0 && (
                          <span className="text-xs text-blue-500">
                            {note.actionItemCount} action{note.actionItemCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
