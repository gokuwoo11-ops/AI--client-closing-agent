export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL);
}


export function requireWorkspaceId(workspaceId?: string | null) {
  const resolved = workspaceId?.trim();
  if (!resolved) {
    throw new Error("Workspace ID is required. Use the signed-in workspace or pass a workspaceId explicitly.");
  }
  return resolved;
}

export async function getWorkspaceOwnerUserId(workspaceId: string) {
  if (!hasDatabase()) return null;
  const { db } = await import("@/lib/db");
  const member = await (db as any).workspaceMember.findFirst({
    where: { workspaceId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
  });
  return member?.userId || null;
}

export async function assertWorkspaceExists(workspaceId: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  const workspace = await (db as any).workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
  return workspace;
}
