# Owner-configurable option funnel update

This build adds owner-managed option pages for the public booking flow.

## What changed

- Owners can add option pages inside `/agent`.
- Each option page can be used for Booking, Enquiry, or Both.
- Owners can add options under each page with a brief saved answer.
- The public `/book/[workspaceId]` page now uses those owner-defined options first.
- When a prospect selects an option, the app calls `/api/public/assistant` so Gemini can analyze the selected option and owner-saved answer, then return a short business-related response.
- The public page no longer shows text like “AI is thinking”; it shows simple “Please wait...” loading text.
- If no custom option pages are configured, the public page still falls back to saved Services and FAQs.

## Required after deployment

Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

Then redeploy.

## Owner setup path

Go to:

```text
/agent → Booking Page Options
```

Create an option page, then add options and saved answers.
