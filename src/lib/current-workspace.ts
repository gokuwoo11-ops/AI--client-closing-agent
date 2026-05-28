import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentWorkspace() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { email: authUser.email },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  const membership = user?.memberships?.[0];

  if (!membership) {
    return null;
  }

  return {
    authUser,
    user,
    workspace: membership.workspace,
  };
}