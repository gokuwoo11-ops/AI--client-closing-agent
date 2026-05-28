# Final Real Progression Build

This version removes temporary/in-memory CRM behavior and does not pretend missing services are working.

## Major changes
- Removed sample workspace helpers and in-memory lead fallback.
- Leads, lead detail, inbox, and channel ingestion require a real database/workspace.
- Gemini is the primary AI provider through `GEMINI_API_KEY`.
- If Gemini is missing, the app returns setup-required responses instead of simulated AI replies.
- Public lead form is workspace-specific: `/lead-form/[workspaceId]`.
- Widget script requires a real workspace ID: `/api/widget.js?workspaceId=...`.
- Auth pages use real Supabase Auth flow.
- Dashboard pages use the signed-in user's workspace.
- WhatsApp, Instagram, and Facebook webhook routes are real setup routes.
- Meta webhook replies are sent only through real provider APIs.
- AGENT replies are not saved for Meta channels unless provider delivery succeeds.

## Required local setup
Create `.env` from `.env.example` and add real values only.

```env
DATABASE_URL=""
DIRECT_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
GEMINI_API_KEY=""
GEMINI_MODEL="models/gemini-2.5-flash"
META_WEBHOOK_VERIFY_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
FACEBOOK_PAGE_ACCESS_TOKEN=""
INSTAGRAM_ACCESS_TOKEN=""
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""
```

## Commands
```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name omnichannel_real_setup
npm run build
npm run dev
```

## Test routes
- `/sign-up`
- `/sign-in`
- `/dashboard`
- `/leads`
- `/inbox`
- `/intake`
- `/integrations`
- `/lead-form/[workspaceId]`
- `/api/webhooks/whatsapp`
- `/api/webhooks/instagram`
- `/api/webhooks/facebook`

## Important
No `DEFAULT_WORKSPACE_ID` or `NEXT_PUBLIC_DEFAULT_WORKSPACE_ID` is used. Use Supabase Auth and `/api/auth/sync-current-user` to create/find the real user, workspace, and membership.
