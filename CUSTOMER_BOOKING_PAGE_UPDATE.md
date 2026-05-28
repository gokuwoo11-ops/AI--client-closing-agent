# Customer-facing booking page update

This update keeps the system integrated inside the main app but separates the experience:

- Business owners use the private dashboard and `/funnel` setup page.
- Prospects/customers use the simple public `/book/[workspaceId]` booking page.

Customer-facing page changes:

- Removed SaaS/CRM/AI-closing language from the public booking page.
- Public page now says “Book with [Business Name]” and focuses only on service, time, contact details, and notes.
- Removed owner notification/debug details from the customer success screen.
- Kept real booking behavior only: lead capture, appointment creation, and email sending depend on real database/Resend setup.
- No demo data or fake booking success was added.

Intended funnel:

1. Business adds the AI booking link to WhatsApp greetings, Instagram/Facebook auto-replies, website buttons, Google profile, and bio links.
2. Prospect opens `/book/[workspaceId]`.
3. Prospect selects service and slot, then submits real contact details.
4. App saves lead + appointment and notifies owner/lead if Resend is configured.
