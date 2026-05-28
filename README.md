# AI Client Closing Agent

Production-focused omnichannel AI closing inbox for service businesses.

## What is included
- Real Supabase Auth and signed-in workspace flow
- Real database-backed lead capture
- Workspace-based public lead form: `/lead-form/[workspaceId]`
- Leads CRM and lead detail page
- Unified inbox across supported source labels
- Real inbound webhook endpoints for WhatsApp, Instagram, and Facebook
- Same-channel AI reply delivery only when real provider credentials are configured
- Gemini-first AI helper with setup-required behavior when `GEMINI_API_KEY` is missing
- Integration setup cards for website widget, email, WhatsApp, Instagram, Facebook, and Google Calendar

## No demo / no mock rule
This project must not pretend that external services are connected.

- No demo workspace IDs.
- No fake channel sending.
- No in-memory CRM fallback.
- No fake login.
- No simulated AI reply when Gemini is missing.
- No saved AGENT reply for Meta channels unless the reply is actually sent through the provider API.

If credentials or provider setup are missing, the app returns setup-required status.

## Required minimum setup
Create `.env` from `.env.example` and fill real values only:

```env
DATABASE_URL="..."
DIRECT_URL="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
GEMINI_API_KEY="..."
GEMINI_MODEL="models/gemini-2.5-flash"
META_WEBHOOK_VERIFY_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_ACCESS_TOKEN="..."
FACEBOOK_PAGE_ACCESS_TOKEN="..."
INSTAGRAM_ACCESS_TOKEN="..."
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="..."
```

## Run locally
```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name omnichannel_real_setup
npm run build
npm run dev
```

## Main routes
- `/sign-up`
- `/sign-in`
- `/dashboard`
- `/agent`
- `/leads`
- `/inbox`
- `/intake`
- `/integrations`
- `/lead-form/[workspaceId]`

## Webhook routes
- `/api/webhooks/whatsapp`
- `/api/webhooks/instagram`
- `/api/webhooks/facebook`

For real provider webhooks, map provider account IDs to workspaces through the `Integration.config` JSON.

## AI Booking Funnel

The current sellable flow is channel-routing first:

1. Add the client AI booking link to WhatsApp/Instagram/Facebook/website/Google auto-replies.
2. Prospects land on `/book/[workspaceId]`.
3. The page captures real lead details, lets the prospect choose a real manual booking slot, runs Gemini qualification, saves the lead/conversation, creates an appointment, and sends real emails only when Resend is configured.
4. Use `/funnel` inside the dashboard to copy auto-reply text, copy the public booking link, and create available slots.

No fake bookings or fake email sends are used. Missing Gemini/Resend/database setup returns setup-required behavior.

## Booking qualification update

The public booking page now works as a simple prospect-facing qualification flow before slot selection:

1. Prospect opens `/book/[workspaceId]` from WhatsApp/Instagram/Facebook/website auto-reply.
2. The page asks quick questions first: service, requirement, preferred time, name, and contact.
3. The qualification is saved to the real database through `/api/public/qualify`.
4. Only after qualification succeeds are booking slots shown.
5. When the prospect selects a slot, `/api/public/bookings` creates the appointment and updates the lead.

No demo/mock booking is included.
