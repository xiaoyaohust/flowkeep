import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ChevronRight, FileText, Pencil, Check, X, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { WorkItemRow } from '@/features/work-items/WorkItemRow'
import { WorkItemDrawer } from '@/features/work-items/WorkItemDrawer'
import { meetingNotesApi } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import type { MeetingNote } from '@personal-work-os/shared'
import { createMeetingNoteSchema, createActionItemFromNoteSchema } from '@personal-work-os/shared'
import { z } from 'zod'

type CreateNoteForm = z.infer<typeof createMeetingNoteSchema>
type ActionItemForm = z.infer<typeof createActionItemFromNoteSchema>

export function MeetingNotes() {
  const qc = useQueryClient()
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null)
  const [creating, setCreating] = useState(false)
  const [creatingAction, setCreatingAction] = useState(false)
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null)
  const [listSearch, setListSearch] = useState('')

  // Inline edit state
  const [editingNotes, setEditingNotes] = useState(false)
  const [editedNotesText, setEditedNotesText] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['meeting-notes', listSearch],
    queryFn: () => meetingNotesApi.list(listSearch || undefined),
  })

  const { data: noteDetail } = useQuery({
    queryKey: ['meeting-note', selectedNote?.id],
    queryFn: () => meetingNotesApi.get(selectedNote!.id),
    enabled: !!selectedNote,
  })

  const noteForm = useForm<CreateNoteForm>({
    resolver: zodResolver(createMeetingNoteSchema),
    defaultValues: { title: '', meetingDate: '', attendees: '', notes: '' },
  })

  const actionForm = useForm<ActionItemForm>({
    resolver: zodResolver(createActionItemFromNoteSchema),
    defaultValues: { title: '', priority: 'medium' },
  })

  const createNoteMut = useMutation({
    mutationFn: meetingNotesApi.create,
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['meeting-notes'] })
      setCreating(false)
      setSelectedNote(note)
      noteForm.reset()
      toast({ title: 'Meeting note created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateNoteMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => meetingNotesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-notes'] })
      qc.invalidateQueries({ queryKey: ['meeting-note', selectedNote?.id] })
      setEditingNotes(false)
      toast({ title: 'Notes saved' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteNoteMut = useMutation({
    mutationFn: (id: string) => meetingNotesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-notes'] })
      setSelectedNote(null)
      toast({ title: 'Deleted' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const createActionMut = useMutation({
    mutationFn: (data: ActionItemForm) =>
      meetingNotesApi.createActionItem(selectedNote!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-note', selectedNote?.id] })
      qc.invalidateQueries({ queryKey: ['work-items'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setCreatingAction(false)
      actionForm.reset()
      toast({ title: 'Action item created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const displayNote = noteDetail ?? selectedNote

  const startEditingNotes = () => {
    setEditedNotesText(displayNote?.notes ?? '')
    setEditingNotes(true)
    setTimeout(() => editTextareaRef.current?.focus(), 50)
  }

  const saveNotes = () => {
    if (!displayNote) return
    updateNoteMut.mutate({ id: displayNote.id, data: { notes: editedNotesText } })
  }

  const cancelEditNotes = () => {
    setEditingNotes(false)
    setEditedNotesText('')
  }

  // Reset edit state when switching notes
  useEffect(() => {
    setEditingNotes(false)
    setEditedNotesText('')
  }, [selectedNote?.id])

  return (
    <div className="h-full flex">
      {/* Left: List */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h1 className="text-base font-semibold text-gray-900">Meeting Notes</h1>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">{listSearch ? 'No results' : 'No meeting notes yet'}</p>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedNote?.id === note.id ? 'bg-blue-50 border-l-2 border-l-blue-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{note.title}</p>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(note.meetingDate)}
                </p>
                {note.actionItems && note.actionItems.length > 0 && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {note.actionItems.length} action item{note.actionItems.length !== 1 ? 's' : ''}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!displayNote ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-10" />
            <p className="text-sm">Select a meeting note to view</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-8">
            {/* Note Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{displayNote.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{formatDate(displayNote.meetingDate)}</span>
                    {displayNote.attendees && <span>· {displayNote.attendees}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setCreatingAction(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Action Item
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (confirm('Delete this note?')) deleteNoteMut.mutate(displayNote.id) }}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes content — inline editable */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</h3>
                {!editingNotes ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditingNotes}
                    className="h-7 text-xs text-gray-400 hover:text-gray-700"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditNotes}
                      className="h-7 text-xs text-gray-400"
                      disabled={updateNoteMut.isPending}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveNotes}
                      className="h-7 text-xs"
                      disabled={updateNoteMut.isPending}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {updateNoteMut.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>

              {editingNotes ? (
                <Textarea
                  ref={editTextareaRef}
                  value={editedNotesText}
                  onChange={(e) => setEditedNotesText(e.target.value)}
                  className="mx-5 mb-4 font-mono text-sm border-gray-200 min-h-[300px] resize-y"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelEditNotes()
                    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                      e.preventDefault()
                      saveNotes()
                    }
                  }}
                />
              ) : (
                <div
                  className="px-5 pb-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed cursor-text"
                  onClick={startEditingNotes}
                  title="Click to edit"
                >
                  {displayNote.notes || (
                    <span className="text-gray-400 italic">Click to add notes...</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">
                  Action Items
                  {displayNote.actionItems && displayNote.actionItems.length > 0 && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                      {displayNote.actionItems.length}
                    </span>
                  )}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setCreatingAction(true)} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {!displayNote.actionItems || displayNote.actionItems.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No action items yet. Click "Action Item" to extract one from this note.
                </p>
              ) : (
                displayNote.actionItems.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedWorkItemId(item.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create note dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Meeting Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={noteForm.handleSubmit((d) => createNoteMut.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Meeting Title *</Label>
              <Input {...noteForm.register('title')} placeholder="e.g. Q2 Planning Kickoff" />
              {noteForm.formState.errors.title && (
                <p className="text-xs text-destructive">{noteForm.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Meeting Date *</Label>
                <Input type="date" {...noteForm.register('meetingDate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Attendees</Label>
                <Input {...noteForm.register('attendees')} placeholder="Alice, Bob, me" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes *</Label>
              <Textarea
                {...noteForm.register('notes')}
                placeholder="Paste or write your meeting notes here..."
                rows={10}
                className="font-mono text-sm"
              />
              {noteForm.formState.errors.notes && (
                <p className="text-xs text-destructive">{noteForm.formState.errors.notes.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={createNoteMut.isPending}>
                {createNoteMut.isPending ? 'Creating...' : 'Create Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create action item dialog */}
      <Dialog open={creatingAction} onOpenChange={setCreatingAction}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Action Item</DialogTitle>
            {selectedNote && (
              <p className="text-xs text-muted-foreground mt-1">
                From: <span className="font-medium">{selectedNote.title}</span>
              </p>
            )}
          </DialogHeader>
          <form onSubmit={actionForm.handleSubmit((d) => createActionMut.mutate(d))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...actionForm.register('title')} placeholder="What needs to be done?" />
              {actionForm.formState.errors.title && (
                <p className="text-xs text-destructive">{actionForm.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input {...actionForm.register('owner')} placeholder="@person" />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" {...actionForm.register('dueDate')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Next Step</Label>
              <Input {...actionForm.register('nextStep')} placeholder="Concrete next action" />
            </div>
            <div className="space-y-1.5">
              <Label>Context (optional)</Label>
              <Textarea {...actionForm.register('description')} placeholder="Additional context..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreatingAction(false); actionForm.reset() }}>Cancel</Button>
              <Button type="submit" disabled={createActionMut.isPending}>
                {createActionMut.isPending ? 'Creating...' : 'Create Action Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Work item drawer */}
      <WorkItemDrawer itemId={selectedWorkItemId} onClose={() => setSelectedWorkItemId(null)} />
    </div>
  )
}
