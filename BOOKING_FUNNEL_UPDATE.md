# AI Booking Funnel Update

This version changes the product from a channel-first chatbot into a real AI booking funnel that can be used from every existing prospect source.

## New product flow

1. Business owner sets WhatsApp/Instagram/Facebook/website auto-replies to send the AI booking link.
2. Prospect opens `/book/[workspaceId]`.
3. Prospect selects service, shares contact details, and chooses an available slot.
4. Gemini qualifies the lead and saves the lead/conversation in the real database.
5. Appointment is created in the database.
6. Owner and lead emails are sent only if Resend is configured.
7. Dashboard shows the lead and booking status.

## New routes

- `/funnel` — dashboard page to manage booking link, auto-reply message, and manual slots.
- `/book/[workspaceId]` — public client-branded booking funnel.
- `/api/bookings/slots` — authenticated slot management.
- `/api/public/workspaces/[workspaceId]` — public booking page data.
- `/api/public/bookings` — public booking submission, AI qualification, appointment creation, email notification.

## No-demo rule

This build does not fake bookings, emails, AI, or channel delivery.

- Missing database returns setup-required/errors.
- Missing Gemini key returns setup-required AI mode.
- Missing Resend keys returns email setup-required instead of pretending email was sent.
- WhatsApp/Instagram/Facebook direct APIs remain optional later connectors.

## Recommended client setup

Use the auto-reply message from `/funnel` in:

- WhatsApp Business greeting message
- WhatsApp Business away message
- Instagram instant reply via Meta Business Suite
- Facebook Messenger instant reply via Meta Business Suite
- Google Business Profile appointment/website link
- Website buttons
- Ads and bio links

## Required setup

- `DATABASE_URL`
- `DIRECT_URL` for migrations/db push
- Supabase Auth keys
- `GEMINI_API_KEY`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` for real email notifications

After replacing files:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```
