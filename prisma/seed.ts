import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // --- Work Items ---
  const item1 = await prisma.workItem.create({
    data: {
      title: 'Review Q2 roadmap doc and add comments',
      description: 'Product shared the Q2 roadmap doc in Notion. Need to review infra section and leave comments before Thursday sync.',
      status: 'todo',
      priority: 'high',
      owner: 'me',
      dueDate: dayjs().add(1, 'day').toDate(),
      category: 'product',
      tags: JSON.stringify(['roadmap', 'q2', 'review']),
      nextStep: 'Open doc, leave inline comments on infra capacity section',
    },
  })

  await prisma.relatedLink.create({
    data: {
      workItemId: item1.id,
      url: 'https://notion.so/q2-roadmap-example',
      title: 'Q2 Roadmap Doc',
    },
  })

  await prisma.workItem.create({
    data: {
      title: 'Unblock auth service deployment — waiting on DevOps to update K8s config',
      description: 'Auth service v2 is ready to deploy but needs updated K8s secrets config. DevOps team is handling this.',
      status: 'waiting',
      priority: 'urgent',
      owner: 'devops-team',
      dueDate: dayjs().toDate(),
      followUpDate: dayjs().add(1, 'day').toDate(),
      blocker: 'DevOps needs to update K8s secrets for new OAuth provider',
      category: 'engineering',
      tags: JSON.stringify(['deploy', 'auth', 'blocking']),
      nextStep: 'Ping @devops in Slack if no update by EOD',
    },
  })

  await prisma.workItem.create({
    data: {
      title: 'Write tech spec for data pipeline refactor',
      description: 'Current ETL pipeline has scaling issues above 10k events/min. Need a spec before we can start implementation.',
      status: 'in_progress',
      priority: 'high',
      owner: 'me',
      dueDate: dayjs().add(5, 'day').toDate(),
      followUpDate: dayjs().add(3, 'day').toDate(),
      category: 'engineering',
      tags: JSON.stringify(['spec', 'data-pipeline', 'tech-debt']),
      nextStep: 'Draft section 3: proposed architecture',
    },
  })

  await prisma.workItem.create({
    data: {
      title: 'Follow up with design on onboarding flow mockups',
      description: 'Design team said mockups would be ready last Friday. Still waiting.',
      status: 'waiting',
      priority: 'medium',
      owner: 'design-team',
      followUpDate: dayjs().add(2, 'day').toDate(),
      category: 'product',
      tags: JSON.stringify(['design', 'onboarding', 'follow-up']),
      nextStep: 'Send Slack message to @design-lead',
    },
  })

  await prisma.workItem.create({
    data: {
      title: 'Migrate legacy user table to new schema',
      description: 'Part of the database consolidation project. Blocked on finance approval for additional RDS storage.',
      status: 'blocked',
      priority: 'high',
      owner: 'me',
      dueDate: dayjs().subtract(2, 'day').toDate(),
      blocker: 'Need finance approval for +50GB RDS storage ($80/mo)',
      category: 'engineering',
      tags: JSON.stringify(['migration', 'database', 'blocked']),
    },
  })

  await prisma.workItem.create({
    data: {
      title: 'Update oncall runbook for new alerting rules',
      description: 'New Datadog alerts went live last week but runbook is outdated.',
      status: 'todo',
      priority: 'medium',
      owner: 'me',
      followUpDate: dayjs().endOf('week').toDate(),
      category: 'engineering',
      tags: JSON.stringify(['oncall', 'runbook', 'documentation']),
      nextStep: 'Update section 4 and 5 in Confluence',
    },
  })

  await prisma.workItem.create({
    data: {
      title: 'Kick off Q2 eng hiring process',
      description: 'Need to align with recruiter on 2 new backend roles. JD draft is done.',
      status: 'todo',
      priority: 'high',
      owner: 'me',
      dueDate: dayjs().add(3, 'day').toDate(),
      followUpDate: dayjs().add(3, 'day').toDate(),
      category: 'people',
      tags: JSON.stringify(['hiring', 'q2', 'people']),
      nextStep: 'Schedule kickoff with recruiter',
    },
  })

  // Completed item
  await prisma.workItem.create({
    data: {
      title: 'Ship v1.2 release notes',
      description: 'Write and publish internal release notes for v1.2.',
      status: 'done',
      priority: 'low',
      owner: 'me',
      category: 'engineering',
      tags: JSON.stringify(['release', 'comms']),
      completedAt: dayjs().subtract(1, 'day').toDate(),
    },
  })

  // --- Meeting Notes ---
  const note1 = await prisma.meetingNote.create({
    data: {
      title: 'Q2 Planning Kickoff',
      meetingDate: dayjs().subtract(1, 'day').toDate(),
      attendees: 'Alice (PM), Bob (Design), Charlie (Eng), me',
      notes: `## Agenda
- Q2 priorities alignment
- Resource allocation
- Timeline review

## Notes
Alice walked through the Q2 priorities. Top 3 are: (1) onboarding revamp, (2) data pipeline scaling, (3) auth v2 rollout.

Bob confirmed design can start onboarding mockups next week. Needs product spec by Monday.

Charlie flagged that data pipeline work needs a proper tech spec before starting. Estimated 2 sprints for full migration.

## Action Items
- [ ] Write tech spec for data pipeline (Charlie → me)
- [ ] Send product spec to design by Monday (Alice)
- [ ] Review roadmap doc and comment before Thursday (me)`,
    },
  })

  // Link the existing work item to this meeting note
  const pipelineItem = await prisma.workItem.findFirst({
    where: { title: { contains: 'data pipeline' } },
  })
  if (pipelineItem) {
    await prisma.meetingNoteActionLink.create({
      data: {
        meetingNoteId: note1.id,
        workItemId: pipelineItem.id,
      },
    })
  }

  await prisma.meetingNote.create({
    data: {
      title: 'Weekly 1:1 with Manager',
      meetingDate: dayjs().subtract(3, 'day').toDate(),
      attendees: 'Manager, me',
      notes: `## Topics
- Roadmap progress
- Hiring timeline
- My concerns about oncall load

## Notes
Discussed Q2 delivery confidence. Manager concerned about the auth deployment delay.

Agreed to kick off hiring process this week — 2 backend engineers needed.

Oncall load is high. Manager will raise with team to rebalance rotation.

## Follow-ups
- Start hiring process for 2 backend roles
- Share oncall stats with manager by Friday`,
    },
  })

  // --- Recurring Templates ---
  await prisma.recurringTemplate.create({
    data: {
      title: 'Weekly 1:1 Prep',
      description: 'Prepare agenda and talking points for weekly 1:1 with manager. Review wins, blockers, and upcoming priorities.',
      frequency: 'weekly',
      category: 'people',
      tags: JSON.stringify(['1:1', 'weekly', 'manager']),
      isActive: true,
      nextDueDate: dayjs().startOf('week').add(1, 'week').toDate(),
    },
  })

  await prisma.recurringTemplate.create({
    data: {
      title: 'Team Sync Follow-up',
      description: 'After weekly team sync: capture action items, update blocked items, send summary to channel.',
      frequency: 'weekly',
      category: 'process',
      tags: JSON.stringify(['team-sync', 'weekly', 'follow-up']),
      isActive: true,
      nextDueDate: dayjs().startOf('week').add(1, 'week').toDate(),
    },
  })

  await prisma.recurringTemplate.create({
    data: {
      title: 'Biweekly Oncall Handoff Review',
      description: 'Review incidents from current oncall rotation, update runbook, hand off to next person.',
      frequency: 'biweekly',
      category: 'engineering',
      tags: JSON.stringify(['oncall', 'handoff', 'biweekly']),
      isActive: true,
      nextDueDate: dayjs().add(7, 'day').toDate(),
    },
  })

  await prisma.recurringTemplate.create({
    data: {
      title: 'Monthly Roadmap Review',
      description: 'Review progress against roadmap, update estimates, flag risks to PM.',
      frequency: 'monthly',
      category: 'product',
      tags: JSON.stringify(['roadmap', 'monthly', 'review']),
      isActive: true,
      nextDueDate: dayjs().startOf('month').add(1, 'month').toDate(),
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
