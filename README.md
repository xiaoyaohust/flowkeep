# Personal Work OS

A local-first personal work management system for engineers, tech leads, and managers.

## Features

- **Dashboard** — grouped view: Today, Waiting, Blocked, Overdue, Follow-up this week
- **Work Items** — full context tracking with status, priority, owner, blocker, next step, links
- **Meeting Notes** → Action Items — capture meetings, extract action items with full context
- **Recurring Templates** — weekly 1:1 prep, team syncs, oncall handoffs
- **Weekly Review** — what you shipped, what's stuck, what's next

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Radix UI |
| State | TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite + Prisma ORM |
| Validation | Zod (shared frontend/backend) |
| Monorepo | pnpm workspaces |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### 1. Install dependencies

```bash
cd personal-work-os
pnpm install
```

### 2. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Apply migrations (creates data/work-os.db)
pnpm db:deploy

# Seed with example data (recommended for first run)
pnpm db:seed
```

The SQLite database is created at `data/work-os.db`.

### 3. Start dev servers

```bash
pnpm dev
```

This starts:
- **API** on http://localhost:3001
- **Web** on http://localhost:5173

Open http://localhost:5173 in your browser.

## Project Structure

```
personal-work-os/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types, Zod schemas, domain logic
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── data/             # SQLite database (gitignored)
```

## Database Commands

```bash
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed example data
pnpm db:studio        # Open Prisma Studio (DB browser)
pnpm db:generate      # Regenerate Prisma client after schema changes
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard groups |
| GET/POST | `/api/work-items` | List / create work items |
| GET/PATCH/DELETE | `/api/work-items/:id` | Get / update / delete |
| POST | `/api/work-items/:id/complete` | Mark as done |
| POST | `/api/work-items/:id/archive` | Archive |
| GET/POST | `/api/meeting-notes` | List / create notes |
| POST | `/api/meeting-notes/:id/create-action-item` | Extract action item |
| GET/POST | `/api/recurring-templates` | List / create templates |
| POST | `/api/recurring-templates/:id/generate` | Generate instance |
| GET | `/api/reviews/weekly?start=&end=` | Weekly review data |

## Work Item Status Flow

```
todo → in_progress → done
       ↓         ↑
     waiting  blocked
       ↓
    archived
```

## Environment Variables

`apps/api/.env`:
```
DATABASE_URL="file:../../data/work-os.db"
PORT=3001
```
