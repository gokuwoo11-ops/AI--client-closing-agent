# AI Service Option Response Update

This build upgrades the public options-first funnel so selected owner-defined services/enquiry options generate a helpful AI-guided explanation before the prospect moves toward booking.

## What changed

- When a prospect chooses `I want to book` and selects a service, the page calls `/api/public/assistant`.
- Gemini uses the saved business profile, services, FAQs, pricing, duration, schedule context, and agent instructions to explain the selected service.
- If Gemini is missing/unavailable, the page falls back to the saved service description/price/duration instead of faking anything.
- When a prospect chooses `I have an enquiry`, the page also asks the assistant to rewrite/answer the selected FAQ/service option in a more helpful receptionist style.
- The owner still controls the selectable options from `/agent`.
- Leads/bookings still save through `/api/public/bookings` and create fresh leads.

## Expected prospect flow

1. Prospect enters name, phone, and email.
2. Prospect chooses `I want to book` or `I have an enquiry`.
3. Prospect selects an owner-defined option.
4. AI explains the selected option using saved business knowledge.
5. Prospect adds requirement/details.
6. Prospect chooses a live owner-controlled slot.
7. Booking/request is saved and visible to the owner.
