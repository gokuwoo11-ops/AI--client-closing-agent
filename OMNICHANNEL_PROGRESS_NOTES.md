# Omnichannel Real-Only Progress Notes

This build is aligned with the no-demo/no-mock rule.

## Implemented now
- Real database-only lead/conversation/message capture.
- Supabase signed-in workspace flow is the expected dashboard source.
- WhatsApp, Instagram, and Facebook webhook routes exist.
- Webhook verification requires real verify tokens.
- Webhooks can map real provider account IDs to a workspace through `Integration.config`.
- Gemini is used only when `GEMINI_API_KEY` is configured.
- If Gemini is missing, the app returns setup-required state and does not fake an AI response.
- Same-channel Meta replies are attempted only through real provider APIs.
- AGENT reply messages are saved for WhatsApp/Instagram/Facebook only after provider delivery succeeds.
- If channel credentials are missing, delivery returns setup-required and does not pretend the message was sent.

## Still setup-required, not mocked
- Meta app credentials and webhook URLs.
- WhatsApp Business phone number ID and access token.
- Facebook Page access token.
- Instagram messaging access token/Page connection.
- Google Calendar OAuth / real booking integration.
- Resend sending domain for owner/manager notifications.

## Next real build step
Add the real booking layer:
1. Calendar connection model and setup UI.
2. Availability lookup.
3. Appointment creation.
4. Owner/manager notification after booked appointment.
5. AI prompt/tool behavior that asks for booking details and only confirms after real booking succeeds.
