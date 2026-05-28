# Options-based prospect flow update

The public booking page now starts with a simple details form instead of a free-chat bot:

1. Prospect enters name, phone, and email.
2. Prospect chooses `I have an enquiry` or `I want to book`.
3. Enquiry shows owner-controlled FAQ/service options and answers.
4. Booking shows owner-controlled service options.
5. Any path can end with available slot selection and a booking request.
6. The backend still saves leads/appointments through the real public booking API.

This removes unreliable free-chat behavior from the primary flow. AI is still used in the background for lead qualification and summary when the request is submitted.
