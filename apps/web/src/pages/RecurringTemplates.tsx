import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, ChevronDown, ChevronRight, Pause, Play } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { WorkItemRow } from '@/features/work-items/WorkItemRow'
import { WorkItemDrawer } from '@/features/work-items/WorkItemDrawer'
import { recurringApi } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import {
  RECURRING_FREQUENCIES,
  FREQUENCY_LABELS,
  createRecurringTemplateSchema,
} from '@personal-work-os/shared'
import type { RecurringTemplate } from '@personal-work-os/shared'
import { z } from 'zod'
import { cn } from '@/lib/utils'

type CreateTemplateForm = z.infer<typeof createRecurringTemplateSchema>

export function RecurringTemplates() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['recurring-templates'],
    queryFn: recurringApi.list,
  })

  const form = useForm<CreateTemplateForm>({
    resolver: zodResolver(createRecurringTemplateSchema),
    defaultValues: { title: '', frequency: 'weekly', tags: [] },
  })

  const createMut = useMutation({
    mutationFn: recurringApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-templates'] })
      setCreating(false)
      form.reset()
      toast({ title: 'Template created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const generateMut = useMutation({
    mutationFn: recurringApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-templates'] })
      qc.invalidateQueries({ queryKey: ['work-items'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Instance generated' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      recurringApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-templates'] }),
  })

  const deleteMut = useMutation({
    mutationFn: recurringApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-templates'] })
      toast({ title: 'Template deleted' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Recurring Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Repeating checklists and tasks</p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Template
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <RefreshCw className="h-10 w-10 mb-3 opacity-10" />
            <p className="text-sm">No recurring templates yet</p>
            <p className="text-xs mt-1">Create templates for weekly 1:1s, oncall handoffs, etc.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                expanded={expandedId === template.id}
                onToggleExpand={() => setExpandedId(expandedId === template.id ? null : template.id)}
                onGenerate={() => generateMut.mutate(template.id)}
                onToggleActive={() => toggleActiveMut.mutate({ id: template.id, isActive: !template.isActive })}
                onDelete={() => { if (confirm('Delete this template?')) deleteMut.mutate(template.id) }}
                onItemClick={setSelectedWorkItemId}
                isGenerating={generateMut.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Recurring Template</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((d) =>
              createMut.mutate({ ...d, tags: d.tags ?? [] })
            )}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...form.register('title')} placeholder="e.g. Weekly 1:1 Prep" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select
                  value={form.watch('frequency')}
                  onValueChange={(v) => form.setValue('frequency', v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRING_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input {...form.register('category')} placeholder="e.g. people, process" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                {...form.register('description')}
                placeholder="What should happen in each instance?"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Next Due Date</Label>
              <Input type="date" {...form.register('nextDueDate')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <WorkItemDrawer itemId={selectedWorkItemId} onClose={() => setSelectedWorkItemId(null)} />
    </div>
  )
}

function TemplateCard({ template, expanded, onToggleExpand, onGenerate, onToggleActive, onDelete, onItemClick, isGenerating }: {
  template: RecurringTemplate
  expanded: boolean
  onToggleExpand: () => void
  onGenerate: () => void
  onToggleActive: () => void
  onDelete: () => void
  onItemClick: (id: string) => void
  isGenerating: boolean
}) {
  const freqColor: Record<string, string> = {
    daily: 'text-purple-700 bg-purple-50 border-purple-200',
    weekly: 'text-blue-700 bg-blue-50 border-blue-200',
    biweekly: 'text-green-700 bg-green-50 border-green-200',
    monthly: 'text-orange-700 bg-orange-50 border-orange-200',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 flex-1 text-left min-w-0"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium',
                  !template.isActive && 'text-gray-400 line-through',
                )}>
                  {template.title}
                </span>
                <span className={cn('text-xs border rounded-full px-2 py-0.5', freqColor[template.frequency] ?? 'text-gray-600 bg-gray-50 border-gray-200')}>
                  {FREQUENCY_LABELS[template.frequency as keyof typeof FREQUENCY_LABELS]}
                </span>
                {!template.isActive && (
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Paused</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                {template.category && <span>{template.category}</span>}
                {template.nextDueDate && <span>Next: {formatDate(template.nextDueDate, 'MMM D')}</span>}
                {template.instances && <span>{template.instances.length} instance{template.instances.length !== 1 ? 's' : ''}</span>}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={!template.isActive || isGenerating}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Generate
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleActive}
              title={template.isActive ? 'Pause' : 'Resume'}
            >
              {template.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={onDelete}
            >
              ×
            </Button>
          </div>
        </div>

        {template.description && (
          <p className="text-xs text-muted-foreground mt-2 pl-6 leading-relaxed">{template.description}</p>
        )}
      </div>

      {expanded && template.instances && (
        <div className="border-t border-gray-100">
          {template.instances.length === 0 ? (
            <p className="px-10 py-3 text-xs text-muted-foreground">No instances generated yet</p>
          ) : (
            template.instances.map((item) => (
              <div key={item.id} className="pl-6">
                <WorkItemRow item={item} onClick={() => onItemClick(item.id)} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
