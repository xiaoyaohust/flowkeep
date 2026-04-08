import { prisma } from '../lib/prisma'
import { NotFoundError } from '../middleware/errorHandler'
import type { CreateWorkItemSchema, UpdateWorkItemSchema } from '@personal-work-os/shared'
import type { WorkItem, Prisma } from '@prisma/client'

function parseTags(raw: string): string[] {
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function serializeTags(tags: string[]): string {
  return JSON.stringify(tags)
}

function formatItem(item: WorkItem & { relatedLinks?: any[]; history?: any[] }) {
  return {
    ...item,
    tags: parseTags(item.tags),
    dueDate: item.dueDate?.toISOString() ?? null,
    followUpDate: item.followUpDate?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    completedAt: item.completedAt?.toISOString() ?? null,
    archivedAt: item.archivedAt?.toISOString() ?? null,
  }
}

export interface ListWorkItemsOptions {
  status?: string
  category?: string
  priority?: string
  search?: string
  tag?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

export async function listWorkItems(opts: ListWorkItemsOptions = {}) {
  const where: Prisma.WorkItemWhereInput = {}

  if (opts.status) where.status = opts.status
  if (opts.category) where.category = opts.category
  if (opts.priority) where.priority = opts.priority

  if (opts.search) {
    where.OR = [
      { title: { contains: opts.search } },
      { description: { contains: opts.search } },
      { owner: { contains: opts.search } },
      { nextStep: { contains: opts.search } },
      { blocker: { contains: opts.search } },
      { tags: { contains: opts.search } },
    ]
  }

  // Tag filter: match exact tag value in JSON array
  if (opts.tag) {
    const tag = opts.tag
    where.AND = [
      {
        OR: [
          { tags: { contains: `"${tag}",` } },
          { tags: { contains: `,"${tag}"` } },
          { tags: { equals: `["${tag}"]` } },
        ],
      },
    ]
  }

  const orderBy: Prisma.WorkItemOrderByWithRelationInput = {
    [(opts.sortBy as keyof WorkItem) || 'updatedAt']: opts.order || 'desc',
  }

  const items = await prisma.workItem.findMany({
    where,
    orderBy,
    include: { relatedLinks: true },
  })

  return items.map(formatItem)
}

export async function getWorkItem(id: string) {
  const item = await prisma.workItem.findUnique({
    where: { id },
    include: {
      relatedLinks: true,
      history: { orderBy: { changedAt: 'desc' } },
    },
  })
  if (!item) throw new NotFoundError('Work item')
  return formatItem(item)
}

export async function createWorkItem(data: CreateWorkItemSchema) {
  const { relatedLinks = [], tags = [], ...rest } = data

  const item = await prisma.workItem.create({
    data: {
      ...rest,
      tags: serializeTags(tags),
      dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
      followUpDate: rest.followUpDate ? new Date(rest.followUpDate) : null,
      relatedLinks: {
        create: relatedLinks.map((l) => ({ url: l.url, title: l.title ?? null })),
      },
    },
    include: { relatedLinks: true },
  })

  return formatItem(item)
}

export async function updateWorkItem(id: string, data: UpdateWorkItemSchema) {
  const existing = await prisma.workItem.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Work item')

  const { relatedLinks, tags, ...rest } = data

  // Track status changes
  if (rest.status && rest.status !== existing.status) {
    await prisma.workItemHistory.create({
      data: {
        workItemId: id,
        field: 'status',
        oldValue: existing.status,
        newValue: rest.status,
      },
    })
  }

  // Replace related links if provided
  if (relatedLinks !== undefined) {
    await prisma.relatedLink.deleteMany({ where: { workItemId: id } })
  }

  const item = await prisma.workItem.update({
    where: { id },
    data: {
      ...rest,
      tags: tags !== undefined ? serializeTags(tags) : undefined,
      dueDate: rest.dueDate !== undefined ? (rest.dueDate ? new Date(rest.dueDate) : null) : undefined,
      followUpDate: rest.followUpDate !== undefined ? (rest.followUpDate ? new Date(rest.followUpDate) : null) : undefined,
      relatedLinks: relatedLinks !== undefined
        ? { create: relatedLinks.map((l) => ({ url: l.url, title: l.title ?? null })) }
        : undefined,
    },
    include: { relatedLinks: true, history: { orderBy: { changedAt: 'desc' } } },
  })

  return formatItem(item)
}

export async function deleteWorkItem(id: string) {
  const existing = await prisma.workItem.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Work item')
  await prisma.workItem.delete({ where: { id } })
}

export async function archiveWorkItem(id: string) {
  const existing = await prisma.workItem.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Work item')

  await prisma.workItemHistory.create({
    data: { workItemId: id, field: 'status', oldValue: existing.status, newValue: 'archived' },
  })

  const item = await prisma.workItem.update({
    where: { id },
    data: { status: 'archived', archivedAt: new Date() },
    include: { relatedLinks: true },
  })
  return formatItem(item)
}

export async function completeWorkItem(id: string) {
  const existing = await prisma.workItem.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Work item')

  await prisma.workItemHistory.create({
    data: { workItemId: id, field: 'status', oldValue: existing.status, newValue: 'done' },
  })

  const item = await prisma.workItem.update({
    where: { id },
    data: { status: 'done', completedAt: new Date() },
    include: { relatedLinks: true },
  })
  return formatItem(item)
}
