# dhan-os

Personal finance OS. Track expenses, monitor net worth, maintain full data ownership. Single-user system designed to replace spreadsheet-based tracking with fast capture and clean dashboards.

## Features

- Fast expense logging: capture workflow via API and Apple Shortcuts
- Transactions: filterable ledger, categorization, split tracking
- Cards: billing cycle management, statement tracking, payment status
- Settings: configurable categories, payment methods, recurring templates
- Self-hostable: single-instance architecture, serverless Postgres backend

## Tech Stack

- Framework: Next.js 16 (App Router), React 19
- Database: PostgreSQL (Neon serverless)
- ORM: Drizzle ORM
- Styling: Tailwind CSS v4, Base UI
- Validation: Zod
- Tooling: Biome, TypeScript

## Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- npm

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/dazzlerkumar/dhan-os.git
cd dhan-os
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set database connection string in `.env`:

```env
DATABASE_URL=postgresql://user:password@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require
```

### 4. Push database schema

```bash
npm run db:push
```

### 5. Run development server

```bash
npm run dev
```

Application runs at `http://localhost:5110`.

## Scripts

- `npm run dev`: start dev server on port 5110
- `npm run build`: build production bundle
- `npm run start`: run production server
- `npm run lint`: check code formatting and lint errors with Biome
- `npm run format`: format files with Biome
- `npm run db:generate`: generate migration files
- `npm run db:migrate`: run database migrations
- `npm run db:push`: push schema directly to database
- `npm run db:studio`: launch Drizzle Studio

## Project Structure

```text
src/
├── api/            # API client modules
├── app/            # Next.js App Router (pages and route handlers)
│   ├── (main)/     # Main application layout and routes (cards, transactions, settings)
│   ├── api/        # REST endpoints (cards, categories, payment methods, transactions)
│   └── login/      # Authentication views
├── components/     # UI primitives and shared components
├── db/             # Drizzle schema and database client
├── hooks/          # Custom React hooks
├── lib/            # Utility helpers and shared logic
└── types/          # TypeScript definitions
```

## License

MIT
