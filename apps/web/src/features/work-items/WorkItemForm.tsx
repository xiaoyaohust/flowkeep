import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  WORK_ITEM_STATUSES,
  PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '@personal-work-os/shared'
import type { WorkItem } from '@personal-work-os/shared'
import dayjs from 'dayjs'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'waiting', 'blocked', 'done', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  followUpDate: z.string().optional(),
  nextStep: z.string().optional(),
  blocker: z.string().optional(),
  category: z.string().optional(),
  tagsRaw: z.string().optional(),
  relatedLinks: z.array(z.object({ url: z.string(), title: z.string().optional() })).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  defaultValues?: Partial<WorkItem>
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
}

function toFormDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return dayjs(iso).format('YYYY-MM-DD')
}

export function WorkItemForm({ defaultValues, onSubmit, onCancel, isLoading, submitLabel = 'Save' }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      status: (defaultValues?.status as any) ?? 'todo',
      priority: (defaultValues?.priority as any) ?? 'medium',
      owner: defaultValues?.owner ?? '',
      dueDate: toFormDate(defaultValues?.dueDate),
      followUpDate: toFormDate(defaultValues?.followUpDate),
      nextStep: defaultValues?.nextStep ?? '',
      blocker: defaultValues?.blocker ?? '',
      category: defaultValues?.category ?? '',
      tagsRaw: defaultValues?.tags?.join(', ') ?? '',
      relatedLinks: defaultValues?.relatedLinks?.map((l) => ({ url: l.url, title: l.title ?? '' })) ?? [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'relatedLinks',
  })

  const handleSubmit = (values: FormValues) => {
    const tags = values.tagsRaw
      ? values.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    onSubmit({
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      owner: values.owner || null,
      dueDate: values.dueDate || null,
      followUpDate: values.followUpDate || null,
      nextStep: values.nextStep || null,
      blocker: values.blocker || null,
      category: values.category || null,
      tags,
      relatedLinks: values.relatedLinks?.map((l) => ({ url: l.url, title: l.title || null })) ?? [],
    })
  }

  const F = form.register

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input {...F('title')} placeholder="What needs to be done?" />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Status + Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) => form.setValue('status', v as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WORK_ITEM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={form.watch('priority')}
            onValueChange={(v) => form.setValue('priority', v as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Owner + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Input {...F('owner')} placeholder="@person or team" />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input {...F('category')} placeholder="e.g. engineering, product" />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" {...F('dueDate')} />
        </div>
        <div className="space-y-1.5">
          <Label>Follow-up Date</Label>
          <Input type="date" {...F('followUpDate')} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Context / Description</Label>
        <Textarea {...F('description')} placeholder="Background, motivation, details..." rows={3} />
      </div>

      {/* Next Step + Blocker */}
      <div className="space-y-1.5">
        <Label>Next Step</Label>
        <Input {...F('nextStep')} placeholder="Concrete next action" />
      </div>
      <div className="space-y-1.5">
        <Label>Blocker</Label>
        <Input {...F('blocker')} placeholder="What's blocking this?" />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <Input {...F('tagsRaw')} placeholder="Comma-separated: deploy, auth, q2" />
      </div>

      {/* Related Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Related Links</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ url: '', title: '' })}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Link
          </Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <Input
                {...F(`relatedLinks.${i}.url`)}
                placeholder="https://..."
                className="text-xs"
              />
              <Input
                {...F(`relatedLinks.${i}.title`)}
                placeholder="Label (optional)"
                className="text-xs"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 mt-0.5"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
