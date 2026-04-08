import { prisma } from '../lib/prisma'
import { NotFoundError } from '../middleware/errorHandler'
import { calculateNextDueDate, getPeriodStart } from '@personal-work-os/shared'
import type {
  CreateRecurringTemplateSchema,
  UpdateRecurringTemplateSchema,
} from '@personal-work-os/shared'

function tryParseJson(val: string): string[] {
  try { return JSON.parse(val) } catch { return [] }
}

function formatTemplate(t: any) {
  return {
    ...t,
    tags: tryParseJson(t.tags ?? '[]'),
    nextDueDate: t.nextDueDate instanceof Date ? t.nextDueDate.toISOString() : t.nextDueDate,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    instances: t.instances?.map((i: any) => ({
      ...i,
      tags: tryParseJson(i.tags ?? '[]'),
      dueDate: i.dueDate?.toISOString() ?? null,
      followUpDate: i.followUpDate?.toISOString() ?? null,
      createdAt: i.createdAt?.toISOString(),
      updatedAt: i.updatedAt?.toISOString(),
      completedAt: i.completedAt?.toISOString() ?? null,
      archivedAt: i.archivedAt?.toISOString() ?? null,
    })),
  }
}

export async function listRecurringTemplates() {
  const templates = await prisma.recurringTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      instances: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })
  return templates.map(formatTemplate)
}

export async function getRecurringTemplate(id: string) {
  const t = await prisma.recurringTemplate.findUnique({
    where: { id },
    include: { instances: { orderBy: { createdAt: 'desc' } } },
  })
  if (!t) throw new NotFoundError('Recurring template')
  return formatTemplate(t)
}

export async function createRecurringTemplate(data: CreateRecurringTemplateSchema) {
  const t = await prisma.recurringTemplate.create({
    data: {
      ...data,
      tags: JSON.stringify(data.tags ?? []),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
    },
    include: { instances: true },
  })
  return formatTemplate(t)
}

export async function updateRecurringTemplate(id: string, data: UpdateRecurringTemplateSchema) {
  const existing = await prisma.recurringTemplate.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Recurring template')

  const t = await prisma.recurringTemplate.update({
    where: { id },
    data: {
      ...data,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
      nextDueDate:
        data.nextDueDate !== undefined
          ? data.nextDueDate
            ? new Date(data.nextDueDate)
            : null
          : undefined,
    },
    include: { instances: { orderBy: { createdAt: 'desc' } } },
  })
  return formatTemplate(t)
}

export async function deleteRecurringTemplate(id: string) {
  const existing = await prisma.recurringTemplate.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('Recurring template')
  await prisma.recurringTemplate.delete({ where: { id } })
}

export async function generateRecurringInstance(templateId: string) {
  const template = await prisma.recurringTemplate.findUnique({ where: { id: templateId } })
  if (!template) throw new NotFoundError('Recurring template')

  const now = new Date()
  const periodStart = getPeriodStart(template.frequency as any, now)

  // Check for duplicate in current period
  const duplicate = await prisma.workItem.findFirst({
    where: {
      recurringTemplateId: templateId,
      sourceType: 'recurring',
      createdAt: { gte: new Date(periodStart) },
    },
  })

  if (duplicate) {
    throw new Error('An instance for this period already exists')
  }

  const nextDue = calculateNextDueDate(template.frequency as any, now)

  const instance = await prisma.workItem.create({
    data: {
      title: template.title,
      description: template.description,
      status: 'todo',
      priority: 'medium',
      category: template.category,
      tags: template.tags,
      sourceType: 'recurring',
      recurringTemplateId: template.id,
      dueDate: new Date(nextDue),
    },
    include: { relatedLinks: true },
  })

  // Update template's next due date
  await prisma.recurringTemplate.update({
    where: { id: templateId },
    data: { nextDueDate: new Date(calculateNextDueDate(template.frequency as any, nextDue)) },
  })

  return {
    ...instance,
    tags: tryParseJson(instance.tags),
    dueDate: instance.dueDate?.toISOString() ?? null,
    followUpDate: instance.followUpDate?.toISOString() ?? null,
    createdAt: instance.createdAt.toISOString(),
    updatedAt: instance.updatedAt.toISOString(),
    completedAt: null,
    archivedAt: null,
  }
}

export async function getTemplateInstances(templateId: string) {
  const instances = await prisma.workItem.findMany({
    where: { recurringTemplateId: templateId },
    orderBy: { createdAt: 'desc' },
    include: { relatedLinks: true },
  })
  return instances.map((i) => ({
    ...i,
    tags: tryParseJson(i.tags),
    dueDate: i.dueDate?.toISOString() ?? null,
    followUpDate: i.followUpDate?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    completedAt: i.completedAt?.toISOString() ?? null,
    archivedAt: i.archivedAt?.toISOString() ?? null,
  }))
}
