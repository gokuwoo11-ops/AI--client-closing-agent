# Final no-demo workspace update

This build removes dashboard dependence on DEFAULT_WORKSPACE_ID / NEXT_PUBLIC_DEFAULT_WORKSPACE_ID.

Real app flow now:
1. User signs up/signs in with Supabase Auth.
2. /api/auth/sync-current-user creates or finds User + Workspace + WorkspaceMember.
3. Dashboard pages call /api/workspace/current.
4. Leads, Inbox, Dashboard, Integrations, Intake, and Settings use the signed-in user's workspace.
5. Public lead forms still use /lead-form/[workspaceId], generated from the current workspace in Dashboard/Integrations.

Important local setup:
- Do not use DEFAULT_WORKSPACE_ID or NEXT_PUBLIC_DEFAULT_WORKSPACE_ID anymore.
- Keep DATABASE_URL, DIRECT_URL, Supabase Auth keys, and GEMINI_API_KEY in .env.
- Run npm install after extracting, because node_modules is not included.

Commands:
npm install
npx prisma validate
npx prisma generate
npm run build
npm run dev

Test:
/sign-up
/sign-in
/dashboard
/integrations
/lead-form/[your-workspace-id]
/leads
/inbox
/intake
