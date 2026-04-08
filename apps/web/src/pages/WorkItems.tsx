import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Trash2, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WorkItemRow } from '@/features/work-items/WorkItemRow'
import { WorkItemForm } from '@/features/work-items/WorkItemForm'
import { WorkItemDrawer } from '@/features/work-items/WorkItemDrawer'
import { workItemsApi } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
  WORK_ITEM_STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@personal-work-os/shared'
import { cn } from '@/lib/utils'

const CATEGORIES = ['engineering', 'product', 'people', 'process', 'other']

export function WorkItems() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [activeTag, setActiveTag] = useState<string>(searchParams.get('tag') ?? '')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  // Sync tag from URL param (e.g. navigated from Dashboard)
  useEffect(() => {
    const urlTag = searchParams.get('tag') ?? ''
    if (urlTag !== activeTag) setActiveTag(urlTag)
  }, [searchParams])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['work-items', { search, status, priority, category, activeTag, sortBy, order }],
    queryFn: () =>
      workItemsApi.list({
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        tag: activeTag || undefined,
        sortBy,
        order,
      }),
  })

  const createMut = useMutation({
    mutationFn: workItemsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-items'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setCreating(false)
      toast({ title: 'Work item created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => workItemsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-items'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Deleted' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setCategory('')
    setActiveTag('')
  }

  const hasFilters = search || status || priority || category || activeTag

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Work Items</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items.length} item{items.length !== 1 ? 's' : ''}
              {activeTag && (
                <span className="ml-1 text-blue-600">tagged #{activeTag}</span>
              )}
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 w-52 text-sm"
            />
          </div>

          <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {WORK_ITEM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority || 'all'} onValueChange={(v) => setPriority(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${sortBy}:${order}`}
            onValueChange={(v) => {
              const [s, o] = v.split(':')
              setSortBy(s)
              setOrder(o as 'asc' | 'desc')
            }}
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
              <SelectItem value="createdAt:desc">Newest first</SelectItem>
              <SelectItem value="dueDate:asc">Due date (soonest)</SelectItem>
              <SelectItem value="priority:desc">Priority</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground">
              Clear filters
            </Button>
          )}
        </div>

        {/* Active tag chip */}
        {activeTag && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Filtering by tag:</span>
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <Tag className="h-3 w-3" />
              #{activeTag}
              <button onClick={() => setActiveTag('')} className="ml-0.5 hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-sm">No work items found</p>
            {hasFilters && <p className="text-xs mt-1">Try clearing your filters</p>}
          </div>
        ) : (
          <div className="bg-white">
            {items.map((item) => (
              <div key={item.id} className="group relative">
                <WorkItemRow
                  item={item}
                  onClick={() => setSelectedId(item.id)}
                  onTagClick={(tag) => {
                    setActiveTag(tag)
                    setSearch('')
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this item?')) deleteMut.mutate(item.id)
                  }}
                  className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500 text-gray-400 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Work Item</DialogTitle>
          </DialogHeader>
          <WorkItemForm
            onSubmit={createMut.mutate}
            onCancel={() => setCreating(false)}
            isLoading={createMut.isPending}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <WorkItemDrawer itemId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
