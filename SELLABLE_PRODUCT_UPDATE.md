# Sellable Product Update - AI Receptionist Direction

This update changes the build direction from a generic lead dashboard into a business-owner friendly AI receptionist system.

## What changed

- Dashboard now explains the real offer: missed-lead recovery and appointment-closing assistance.
- Dashboard focuses on owner-friendly numbers: leads captured, hot leads, booked/won, conversations.
- Added a real embeddable website AI chat widget route:
  - `/api/widget.js?workspaceId=...`
  - `/widget/[workspaceId]`
- The widget uses the real `/api/chat` Gemini route and real `/api/leads` capture route.
- If Gemini or database setup is missing, the widget shows setup-required/error behavior instead of fake success.
- Sidebar navigation is simpler: Home, Inbox, Leads, AI Receptionist, Channels, Business Setup, Settings.

## How to sell this version

Do not sell it as a dashboard or lead form. Sell it as:

"An AI receptionist that replies instantly to website visitors, captures their contact details, and pushes them toward booking. WhatsApp/Instagram/Facebook are added after real channel access is available."

## Next real build steps

1. Owner email/notification setup.
2. Calendar availability and booking.
3. Human takeover / pause AI switch.
4. WhatsApp once Meta Business Portfolio is available.
5. Instagram/Facebook after Meta permissions are ready.

## No-demo rule

This build still keeps the rule: no demo data, no mock replies, no fake channel sends. Missing services must show setup-required behavior.
