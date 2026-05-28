# Business Knowledge Save Fix

This build fixes the issue where services/FAQs appeared on the AI Agent page but were not actually available to the public booking assistant.

## Fixed
- Creating a service now auto-creates the workspace business profile if it is missing.
- Creating an FAQ now auto-creates the workspace business profile if it is missing.
- Agent configuration save also ensures a business profile exists.
- The AI Agent page no longer shows an added service/FAQ as successful until the database save succeeds.
- If saving fails, the UI shows the real error instead of silently pretending it worked.

## Why this matters
The public booking assistant can only answer questions like “what kind of service do you provide?” from real saved Services and FAQs in the database.
