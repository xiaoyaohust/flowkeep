import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, CheckCircle, Archive, Clock } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { WorkItemForm } from './WorkItemForm'
import { workItemsApi } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { formatDate, formatRelative } from '@/lib/utils'
import type { WorkItem } from '@personal-work-os/shared'
import { useState } from 'react'

interface Props {
  itemId: string | null
  onClose: () => void
}

export function WorkItemDrawer({ itemId, onClose }: Props) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: item, isLoading } = useQuery({
    queryKey: ['work-item', itemId],
    queryFn: () => workItemsApi.get(itemId!),
    enabled: !!itemId,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['work-items'] })
    qc.invalidateQueries({ queryKey: ['work-item', itemId] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const updateMut = useMutation({
    mutationFn: (data: any) => workItemsApi.update(itemId!, data),
    onSuccess: () => {
      invalidate()
      setEditing(false)
      toast({ title: 'Saved' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const completeMut = useMutation({
    mutationFn: () => workItemsApi.complete(itemId!),
    onSuccess: () => { invalidate(); toast({ title: 'Marked as done' }) },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const archiveMut = useMutation({
    mutationFn: () => workItemsApi.archive(itemId!),
    onSuccess: () => { invalidate(); onClose(); toast({ title: 'Archived' }) },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  return (
    <Sheet open={!!itemId} onOpenChange={(open) => { if (!open) { onClose(); setEditing(false) } }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0">
        {isLoading && (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {item && !editing && <WorkItemDetail item={item} onEdit={() => setEditing(true)} onComplete={() => completeMut.mutate()} onArchive={() => archiveMut.mutate()} />}

        {item && editing && (
          <div className="p-6">
            <SheetHeader className="mb-4">
              <SheetTitle>Edit Work Item</SheetTitle>
              <SheetDescription>Update the details below.</SheetDescription>
            </SheetHeader>
            <WorkItemForm
              defaultValues={item}
              onSubmit={updateMut.mutate}
              onCancel={() => setEditing(false)}
              isLoading={updateMut.isPending}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function WorkItemDetail({ item, onEdit, onComplete, onArchive }: {
  item: WorkItem
  onEdit: () => void
  onComplete: () => void
  onArchive: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{item.category || 'No category'}</p>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{item.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={item.status as any} />
              <PriorityBadge priority={item.priority as any} />
              {item.owner && (
                <span className="text-xs text-muted-foreground">Owner: {item.owner}</span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        </div>

        {/* Action buttons */}
        {item.status !== 'done' && item.status !== 'archived' && (
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={onComplete} className="text-green-700 border-green-200 hover:bg-green-50">
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Done
            </Button>
            <Button variant="outline" size="sm" onClick={onArchive} className="text-gray-500">
              <Archive className="h-3.5 w-3.5 mr-1" /> Archive
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <FieldDisplay label="Due Date" value={formatDate(item.dueDate)} />
          <FieldDisplay label="Follow-up" value={formatDate(item.followUpDate)} />
        </div>

        {/* Context */}
        {item.description && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Context</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
          </div>
        )}

        {/* Next Step */}
        {item.nextStep && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Next Step</p>
            <p className="text-sm text-gray-800 font-medium">{item.nextStep}</p>
          </div>
        )}

        {/* Blocker */}
        {item.blocker && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-medium text-red-600 mb-1">Blocker</p>
            <p className="text-sm text-red-700">{item.blocker}</p>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Links */}
        {item.relatedLinks && item.relatedLinks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Related Links</p>
            <div className="space-y-1">
              {item.relatedLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {link.title || link.url}
                </a>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* History */}
        {item.history && item.history.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">History</p>
            <div className="space-y-2">
              {item.history.map((h) => (
                <div key={h.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-gray-600">{h.field}</span>:{' '}
                    {h.oldValue || '(none)'} → {h.newValue || '(none)'}{' '}
                    <span className="text-gray-400">· {formatRelative(h.changedAt)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-0.5 pb-4">
          <p>Created {formatRelative(item.createdAt)}</p>
          <p>Updated {formatRelative(item.updatedAt)}</p>
          {item.completedAt && <p>Completed {formatRelative(item.completedAt)}</p>}
        </div>
      </div>
    </div>
  )
}

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}
