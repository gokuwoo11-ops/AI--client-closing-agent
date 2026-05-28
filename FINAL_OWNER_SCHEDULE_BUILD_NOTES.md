# Final owner schedule + qualified booking build

This build updates the product around the final flow:

1. Business owner controls schedules/slots inside the owner app.
2. Public prospect page starts with qualification chat before showing slots.
3. The chatbot reads live booking slots from the owner schedule automatically.
4. After a prospect selects a slot, the app creates an appointment and marks the lead as BOOKED.
5. Booked slots are removed from the public available-slot list when capacity is reached.
6. Dashboard now shows today's booked schedule first, sorted by appointment time.
7. Leads CRM highlights booked leads and shows appointment details.
8. Lead detail page shows booked schedule details.
9. New owner schedule page: /appointments.

No demo data or fake booking success was added.

After extracting:

npm install
npx prisma generate
npx prisma db push
npm run build

Then push to GitHub and redeploy Vercel.
