export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL);
}

export function requireWorkspaceId(workspaceId?: string | null) {
  const resolved = workspaceId?.trim();

  if (!resolved) {
    throw new Error(
      "Workspace ID is required. Use the signed-in workspace or pass a workspaceId explicitly.",
    );
  }

  return resolved;
}

export async function getWorkspaceOwnerUserIds(workspaceId: string) {
  if (!hasDatabase()) return [];

  const { db } = await import("@/lib/db");

  const owners = await (db as any).workspaceMember.findMany({
    where: {
      workspaceId,
      role: "OWNER",
    },
    select: {
      userId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return owners
    .map((member: { userId?: string | null }) => member.userId)
    .filter(Boolean) as string[];
}

// Backward-compatible helper for older files that still import singular name
export async function getWorkspaceOwnerUserId(workspaceId: string) {
  const ownerIds = await getWorkspaceOwnerUserIds(workspaceId);
  return ownerIds[0] || null;
}

export async function assertWorkspaceExists(workspaceId: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const { db } = await import("@/lib/db");

  const workspace = await (db as any).workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  return workspace;
}