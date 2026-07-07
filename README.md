<div align="center">

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />

<br /><br />

# SalesFlow CRM

### A precision-built sales pipeline management system for performance marketing agencies.

Track deals from first contact to closed. Manage your team with role-based access. Report on what actually matters.

<br />

[Live Demo](https://scales-flow.vercel.app) · [Report a Bug](https://github.com/Web-Developer-Ali/Scales_Flow/issues) · [Request a Feature](https://github.com/Web-Developer-Ali/Scales_Flow/scalesflow/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Role System](#role-system)
- [Email Notifications](#email-notifications)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

SalesFlow is a full-stack CRM built specifically for **performance marketing agencies**. Unlike generic CRM tools, it is designed for a single-agency deployment — one admin, a team of managers, and their sales representatives. Every feature, query, and UI decision was made with that context in mind.

It was built as a portfolio project to demonstrate real-world full-stack engineering — not just CRUD, but production-grade database optimization, role-based access control enforced at every layer, a typed API surface, and a clean component architecture.

---

## Features

### 🔐 Role-Based Access Control

Three roles enforced at middleware, API, and database levels simultaneously.

| Role          | Capability                                                            |
| ------------- | --------------------------------------------------------------------- |
| **Admin**     | Full visibility. Manages the entire team and pipeline.                |
| **Manager**   | Sees their team's deals and performance. Manages their assigned reps. |
| **Sales Rep** | Sees only their own deals, clients, and performance.                  |

### 📊 Dashboards

- **Admin Dashboard** — total pipeline, team performance, deal stage breakdown, recent deals, real month-on-month deltas
- **Manager Dashboard** — team pipeline, per-rep progress, personal pipeline, team activity feed
- **Sales Rep Dashboard** — personal pipeline, hot leads, stalled deal detection, 6-month trend charts

### 💼 Deal Management

- Full deal lifecycle: Prospect → Qualified → Demo → Negotiation → Closed
- Stage progression with confirmation dialogs
- Status tracking: Active, Won, Lost, On-Hold
- Probability-weighted expected revenue calculation
- Days-in-stage urgency coloring (14d amber, 21d red)
- Link deals to client records

### 👥 Team Management

- Admin creates managers and sales reps
- Email OTP verification on account creation
- Block / unblock users without deleting history
- Assign and reassign sales reps to managers
- `manager_id` column separates current management from `created_by` audit trail

### 🏢 Client Management

- Full client profiles with contact details
- Link multiple deals to a single client
- Revenue and pipeline tracking per client
- Win rate per client relationship
- Role-scoped: reps see their clients, managers see their team's

### 📈 Reports (Phase 4)

- **Admin Reports** — 12-month revenue chart, deal funnel conversion, pipeline health, top reps by revenue, win rate, avg close time. CSV export.
- **Manager Reports** — same scope but team-only. Rep-by-rep comparison table. Fastest closers this month.
- **Rep Performance** — 6-month personal trend, win rate history, personal best month, active pipeline by stage.

### 🔔 Notifications (Phase 5)

- In-app notification bell with unread count badge and 30s polling
- Deal won / lost / stage changed → manager notified
- Deal stalled 7+ days → rep reminded
- Monthly target check-in on the 15th
- New team member welcome email with OTP

### 📧 Email System

Flexible email provider support — works out of the box with Gmail, can be upgraded to custom domain via Resend or any SMTP server. Admin can toggle email on/off and configure per-notification-type from the settings UI.

### 🔍 Global Search

- ⌘K shortcut anywhere in the app
- Searches deals and clients simultaneously in parallel
- Role-scoped results
- 250ms debounce

### 👤 Profile & Settings

- Update name and company
- Change password with strength meter
- Login history from audit log
- Accessible from all three role dashboards

---

## Tech Stack

| Layer                | Technology                       |
| -------------------- | -------------------------------- |
| **Framework**        | Next.js 15 (App Router)          |
| **Language**         | TypeScript 5                     |
| **Database**         | PostgreSQL 16 (Neon DB / Docker) |
| **ORM**              | Prisma                           |
| **Auth**             | NextAuth.js v4                   |
| **Styling**          | Tailwind CSS 4                   |
| **UI Components**    | shadcn/ui                        |
| **Charts**           | Recharts                         |
| **Email**            | Nodemailer (Gmail) / Resend      |
| **HTTP Client**      | Axios                            |
| **Password Hashing** | bcryptjs                         |
| **Package Manager**  | pnpm                             |
| **Deployment**       | Vercel                           |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 15                           │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Middleware  │    │  App Router  │    │  API Routes   │  │
│  │  (RBAC)     │───▶│  (Pages)     │    │  (REST)       │  │
│  └─────────────┘    └──────────────┘    └───────┬───────┘  │
│                                                 │           │
│  ┌──────────────────────────────────────────────▼───────┐  │
│  │                    Service Layer                      │  │
│  │  notifications.ts · email-notifications.ts            │  │
│  │  email-provider.ts · export-csv.ts                   │  │
│  └──────────────────────────────┬────────────────────────┘  │
│                                 │                           │
│  ┌──────────────────────────────▼────────────────────────┐  │
│  │                   Database Layer                       │  │
│  │  lib/db.ts (pg Pool) · PostgreSQL CTEs + Indexes      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Single CTE queries** — Every dashboard API is a single SQL round-trip using Common Table Expressions. The admin dashboard executes one query that returns pipeline value, closed value, team performance, stage breakdown, and recent deals simultaneously.

**Covering indexes** — `INCLUDE (value)` on composite indexes eliminates heap fetches for `SUM(value)` aggregations, which are the most frequent dashboard queries.

**Partial indexes** — `WHERE status = 'won'` partial indexes on the deals table reduce index size and speed up close-time calculations that only care about won deals.

**Role enforcement at three layers** — middleware redirects wrong-role navigation, API routes reject unauthorized requests, SQL queries scope results to the authenticated user's data. A sales rep cannot see another rep's deals even with a direct API call.

**`manager_id` vs `created_by`** — `created_by` is immutable audit history. `manager_id` is the operational relationship and can be reassigned by admin without losing who originally created the user.

---

## Database Schema

Five core tables:

```
users
  ├── id, email (CITEXT), name, role
  ├── created_by → users (immutable, audit)
  ├── manager_id → users (operational, reassignable)
  ├── email_otp, reset_password_otp
  ├── is_active, is_verified
  └── login_count, last_login_at

clients
  ├── id, company_name, industry, website
  ├── primary_contact_name/email/phone
  ├── status (prospect | active | inactive)
  └── assigned_to → users

deals
  ├── id, title, company, value
  ├── stage (prospect → qualified → demo → negotiation → closed)
  ├── status (active | won | lost | on-hold)
  ├── probability, expected_close_date
  ├── client_id → clients
  ├── assigned_to → users
  └── generated_month (set by trigger from created_at)

notifications
  ├── id, user_id, type, title, message
  ├── entity_type, entity_id (polymorphic link)
  └── is_read, read_at

user_activities
  ├── id, user_id, performed_by
  ├── activity_type (enum: login, deal_created, deal_updated, ...)
  ├── entity_type, entity_id
  └── ip_address, user_agent (audit context)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL 14+ (local Docker or Neon DB)

### Installation

```bash
# Clone the repository
git clone https://github.com/Web-Developer-Ali/Scales_Flow
cd scalesflow

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
pnpm db:push

# Run the SQL schema files in order
# 01_users.sql → 02_deals.sql → 03_clients.sql → 04_notifications.sql

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The first user you register will automatically become the admin.

### Docker PostgreSQL (local dev)

```bash
docker run --name salesflow-db \
  -e POSTGRES_DB=salesflow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16
```

---

## Environment Variables

```bash
# ── App ───────────────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# ── NextAuth ──────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NODE_ENV=

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/salesflow
# For Neon DB:
# DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/salesflow?sslmode=require

# ── Email (choose one) ────────────────────────────────────────────────────────
EMAIL_PROVIDER=nodemailer        # or "resend"

# Gmail (free, for development and small teams)
GMAIL_USER=your@gmail.com
GMAIL_PASSWORD=your-app-password # Gmail App Password

# Resend (production, custom domain)
# RESEND_API_KEY=re_xxxxxxxxxxxx
# RESEND_FROM=SalesFlow <notifications@yourdomain.com>

# ── Cron jobs ─────────────────────────────────────────────────────────────────
CRON_SECRET=your-random-cron-secret
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth_pages)/          # Login, signup, OTP verification
│   ├── (Route_pages)/
│   │   ├── admin/             # Admin dashboard, team, reports, activity, settings
│   │   ├── manager/           # Manager dashboard, deals, reports, activity
│   │   ├── scales_man/        # Rep dashboard, deals, clients, performance
│   │   ├── deals/             # Deal create , [id] CRUD
│   │   └── profile/           # Shared profile page (all roles)
│   │   └── clients/           # clients detaila and CRUD opertions (all roles)
│   └── api/
│       ├── admin/             # Team management, assign, block, delete, reports
│       ├── auth /             # NextAuth setup, Email Verfication, register admin, resend otp
│       ├── manager/           # Manager dashboard, deals, reports
│       ├── sales-rep/         # Rep dashboard, deals, performance
│       ├── deals/             # Create, [id] CRUD
│       ├── clients/           # List, create, [id] CRUD, search
│       ├── activity-feed/     # Admin + manager audit feed
│       ├── search/            # Global search
│       ├── profile/           # Profile read + update
│       └── cron/              # Stalled deals + monthly target jobs
│
├── components/
│   ├── admin/                 # Admin-specific components + hooks
│   ├── manager/               # Manager-specific components + hooks
│   ├── salesRep/              # Rep-specific components + hooks
│   ├── clients/               # Client selector, hooks
│   ├── deal_details/          # Deal detail hook
│   ├── add_deals/             # Add deal form sections
│   └── shared/                # GlobalSearch, NotificationBell, ActivityFeed,
│                              # useProfile, useNotifications, useActivityFeed
│
├── lib/
│   ├── db.ts                  # PostgreSQL pool
│   ├── notifications.ts       # In-app notification helpers
│   ├── export-cvs.ts          # To generate performance file.
│   └── email/
│       ├── email-provider.ts  # Provider abstraction (nodemailer / resend)
│       ├── email-notifications.ts
│       ├── templates.ts       # HTML email templates
│       └── otp-service.ts     # OTP email (bypasses enabled toggle)
│
└── types/
│   └── Define type of all pages.
└── schema/
│   └── Define postgres table's schema.
└── proxy.ts/
    └── Middleware for handle role base routing.
```

---

## API Reference

All routes require authentication via NextAuth session cookie.

### Deals

| Method                     | Route                  | Auth                                  | Description         |
| -------------------------- | ---------------------- | ------------------------------------- | ------------------- |
| `POST`                     | `/api/deals/create`    | rep, manager                          | Create a deal       |
| `GET`                      | `.../deal-detail/[id]` | scoped                                | Get deal detail     |
| `PATCH`                    | `.../deal-detail/[id]` | scoped                                | Update deal         |
| `DELETE`                   | `.../deal-detail/[id]` | rep, admin                            | Delete deal         |
| `GET`                      | `.../notification`     | manager                               | Fetch notifications |
| `PATCH` `.../notification` | manager                | mark one or all notifications as read |

### Clients

| Method   | Route                 | Auth       | Description                |
| -------- | --------------------- | ---------- | -------------------------- |
| `GET`    | `/api/clients`        | all        | List clients (role-scoped) |
| `POST`   | `/api/clients`        | all        | Create client              |
| `GET`    | `/api/clients/[id]`   | scoped     | Client detail + deals      |
| `PATCH`  | `/api/clients/[id]`   | scoped     | Update client              |
| `DELETE` | `/api/clients/[id]`   | rep, admin | Delete client              |
| `GET`    | `/api/clients/search` | all        | Search clients (dropdown)  |

### Team Management (Admin only)

| Method      | Route                        | Description                  |
| ----------- | ---------------------------- | ---------------------------- |
| `GET/POST`  | `/api/admin/add_users`       | List team / create user      |
| `GET/PATCH` | `/api/admin/assignTeam`      | View / reassign team members |
| `PATCH`     | `/api/admin/blockUser/[id]`  | Block or unblock a user      |
| `DELETE`    | `/api/admin/deleteUser/[id]` | Delete a user                |

### Dashboards

| Route                        | Auth    | Description                  |
| ---------------------------- | ------- | ---------------------------- |
| `/api/admin/dashboard`       | admin   | Full admin dashboard metrics |
| `/api/manager/dashboard`     | manager | Team + personal metrics      |
| `/api/sales-rep/dashboard`   | rep     | Personal metrics             |
| `/api/admin/reports`         | admin   | Full analytics               |
| `/api/manager/reports`       | manager | Team analytics               |
| `/api/sales-rep/performance` | rep     | 6-month history              |

### Other

| Route            | Auth                                | Description                     |
| ---------------- | ----------------------------------- | ------------------------------- |
| `GET`            | `/api/activity-feed`                | Audit feed (admin/manager)      |
| `GET`            | `/api/search`                       | Global search (deals + clients) |
| `GET/PATCH`      | `/api/profile`                      | Profile read + update           |
| `GET/PATCH/POST` | `/api/admin/setting/email-settings` | Email config + test             |

---

## Role System

```
                        ┌─────────────┐
                        │    Admin    │
                        │  (1 total)  │
                        └──────┬──────┘
                               │ creates + assigns
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
       │  Manager A  │  │  Manager B  │  │  Manager C  │
       └──────┬──────┘  └──────┬──────┘  └─────────────┘
              │                │
       ┌──────┼──────┐  ┌──────┼──────┐
       │      │      │  │      │      │
      Rep   Rep    Rep Rep    Rep    Rep
```

- Admin enforced as singleton at database level (unique partial index)
- Role transitions not allowed (a rep cannot become a manager without admin intervention)
- `created_by` is immutable — records who onboarded the user
- `manager_id` is mutable — records who currently manages the user

---

## Email Notifications

SalesFlow supports two email providers with zero-config fallback:

```
Priority order:
  1. Admin-configured DB settings (via /admin/settings/email UI)
  2. Environment variables (.env)
  3. Disabled (logs to console, no emails sent)
```

| Trigger                 | Recipient       | Template                     |
| ----------------------- | --------------- | ---------------------------- |
| Deal marked Won         | Manager         | Deal won summary with value  |
| Deal stalled 7+ days    | Assigned rep    | Deal stall reminder with CTA |
| New team member created | New user        | Welcome email with OTP code  |
| 15th of every month     | All active reps | Monthly target check-in      |

OTP emails bypass the enabled toggle — new users always receive their verification code.

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Cron Jobs

Add to `vercel.json` at the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-stalled-deals",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/monthly-target-reminder",
      "schedule": "0 9 15 * *"
    }
  ]
}
```

Set `CRON_SECRET` in your environment — Vercel automatically passes it as an `Authorization: Bearer` header to cron routes.

### Neon DB

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set `DATABASE_URL` in your Vercel environment variables
4. Run the SQL schema files against your Neon database

---

## Roadmap

- [x] Phase 1 — Foundation (Admin dashboard, team management, role-based auth)
- [x] Phase 2 — Deal Management (CRUD, detail page, manager team view)
- [x] Phase 3 — Client Management (profiles, deal linking, client detail)
- [x] Phase 4 — Reports (Admin, Manager, Rep performance history)
- [x] Phase 5 — Notifications (In-app bell, activity feed, email notifications)
- [x] Phase 6 — Polish (Middleware, profile page, global search)
- [ ] Gmail / Outlook email sync (auto-log emails to deals)
- [ ] Retainer / recurring revenue tracking
- [ ] Client portal (read-only deal view for clients)
- [ ] Bulk email campaigns from within CRM

---

## Author

**Ali** — Full-Stack Developer

- GitHub: [@Web-Developer-Ali](https://github.com/Web-Developer-Ali)
- Portfolio: [webdevali.com](https://webdevali.com)
- Project: [scales-flow.vercel.app](https://scales-flow.vercel.app)

---

<div align="center">

Built with Next.js, PostgreSQL, and a lot of CTEs.

⭐ Star this repo if it helped you build something real.

</div>
