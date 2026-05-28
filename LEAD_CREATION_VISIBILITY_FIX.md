# Lead Creation Visibility Fix

This build changes public prospect submissions so every new enquiry/booking funnel submission creates a fresh Lead record instead of merging into an existing Lead by phone/email.

Why:
- Public booking/enquiry submissions should be visible as new requests in the owner dashboard.
- Same phone/email can submit multiple times, and each request should appear separately for the business.

Technical change:
- `handleIncomingChannelMessage()` now supports `createNewLead: true`.
- `/api/public/bookings` uses `createNewLead: true`.
- `/api/public/qualify` uses `createNewLead: true`.
- Channel webhooks/manual inbox can still dedupe/update existing leads unless explicitly set otherwise.
