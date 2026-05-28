# Business Knowledge Assistant Update

This build upgrades the public booking page from a fixed question flow into a business-knowledge assistant.

## What changed

- Added `/api/public/assistant`.
- Public chatbot now sends each prospect message to the assistant endpoint.
- The assistant answers business-related questions using saved business profile, services, FAQs, agent instructions, and live booking slots.
- The assistant extracts qualification fields from natural conversation:
  - service needed
  - requirement/details
  - preferred timing
  - name
  - phone/email
- Booking slots are shown only after qualification details are collected.
- The assistant must not invent prices, discounts, policies, services, or unavailable slots.
- If an answer is not available in saved business knowledge, the assistant should say the team will confirm and continue qualification.
- Unknown questions can be recorded as knowledge gaps after `npx prisma db push` adds the `KnowledgeGap` table.

## Owner setup needed

Owners should add real business knowledge in the dashboard:

- Business profile
- Services
- Prices/duration
- FAQs
- Working hours/location/contact
- Custom AI instructions
- Booking slots

## Commands

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

## Public flow

Prospect opens `/book/[workspaceId]`:

1. Prospect can ask any business-related question.
2. Assistant answers using saved business knowledge.
3. Assistant asks one next missing qualification question.
4. Once service/details/time/name/contact are collected, slots appear.
5. Prospect chooses a slot and booking is saved.
