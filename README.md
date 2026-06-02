# AI Client Closing Agent — Premium Real MVP

Production-focused MVP for service businesses to capture enquiries, qualify leads, run a public booking funnel, store CRM conversations, and notify the owner/team.

This build keeps the original MVP idea and stack:

- Next.js 16 App Router
- Supabase Auth
- Supabase Postgres through Prisma
- Gemini as the AI provider
- Resend for owner/lead email notifications
- Meta webhook-ready routes for WhatsApp, Instagram, and Facebook

It does **not** use the separate Vite/Express/Drizzle/Manus prototype stack. Premium UI ideas were merged into this real database-backed app only.

## What is included

- Supabase Auth sign-in/sign-up flow with workspace sync.
- Multi-tenant workspace data model through Prisma + Supabase Postgres.
- Premium landing page, owner dashboard shell, public lead form, and public booking funnel.
- Public lead form: `/lead-form/[workspaceId]`.
- Premium public booking funnel: `/book/[workspaceId]`.
- Embeddable website widget: `/api/widget.js?workspaceId=YOUR_WORKSPACE_ID`.
- Owner dashboard, leads CRM, inbox, AI receptionist settings, booking funnel setup, schedule/appointments, integrations, and intake console.
- Real notification records for new leads/bookings shown in the dashboard alert menu.
- Gemini-first AI replies and lead qualification. If `GEMINI_API_KEY` is missing, the app returns setup-required responses instead of simulated AI output.
- Email notification support through Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.
- Real webhook handlers for WhatsApp, Instagram, and Facebook mapping provider accounts to workspace integrations.

## Required setup

Create `.env` from `.env.example` and fill real values:

```bash
cp .env.example .env
```

Minimum required for local app use:

```env
DATABASE_URL="..."
DIRECT_URL="..."
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
GEMINI_API_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional production values:

```env
SUPABASE_SERVICE_ROLE_KEY="..."
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="verified@yourdomain.com"
META_WEBHOOK_VERIFY_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_ACCESS_TOKEN="..."
INSTAGRAM_ACCESS_TOKEN="..."
FACEBOOK_PAGE_ACCESS_TOKEN="..."
STRIPE_SECRET_KEY="..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
```

Do not commit `.env`. It contains private keys.

## Run locally

```bash
npm install
npm run db:generate
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open:

```text
http://localhost:3000
```

## Database setup

For the first local/Supabase development setup, after filling `.env`, run:

```bash
npm run db:push
```

For production deployments with migrations already created later, use:

```bash
npm run db:migrate
```

Do not run destructive reset commands unless you intentionally want to delete database data.

## Main routes

- `/sign-up`
- `/sign-in`
- `/dashboard`
- `/leads`
- `/inbox`
- `/agent`
- `/funnel`
- `/appointments`
- `/integrations`
- `/intake`
- `/settings`
- `/lead-form/[workspaceId]`
- `/book/[workspaceId]`
- `/api/widget.js?workspaceId=[workspaceId]`

## Selling checklist

Before sharing with a client:

1. Create/sign in with the owner account.
2. Finish onboarding and confirm the workspace exists.
3. Add real services, FAQ answers, funnel option pages, and booking slots.
4. Test `/lead-form/[workspaceId]` and `/book/[workspaceId]`.
5. Confirm leads appear in `/leads`, `/inbox`, `/appointments`, and dashboard alerts.
6. Add Resend values if the owner should receive email alerts.
7. Deploy to Vercel and update `NEXT_PUBLIC_APP_URL` to the deployed URL.
8. Add Meta webhook URLs only after deployment.

## Deployment notes

- This project uses Next.js 16 and the `proxy.ts` convention instead of deprecated `middleware.ts`.
- Public lead capture, public booking, and public chat APIs are intentionally not blocked by auth proxy.
- Protected dashboard/API routes verify the signed-in workspace.
- `npm run typecheck` performs TypeScript validation separately. `next build` skips internal Next type validation to avoid deploy-time hangs with the generated Prisma client, while normal TypeScript checking still passes through the separate script.

## Flow option chaining

The public booking funnel now supports real sequential flow options.

Example setup:
1. Go to `/agent`.
2. Create one option page, for example `What do you need?`.
3. Add a main option with `No parent`, for example `Website`.
4. Add another option and choose `After: Website`, for example `New website`.
5. Add another child option and choose `After: New website`, for example `Business website`.
6. Open `/book/[workspaceId]`.

The prospect will see:
`Website` → `New website` → `Business website` → requirement/slot → saved lead.

This is database-backed through `FunnelOptionPage` and `FunnelOption`; no mock flow data is used.
