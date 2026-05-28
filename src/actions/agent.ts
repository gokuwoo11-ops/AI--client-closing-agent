"use server";

import { revalidatePath } from "next/cache";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

async function requireCurrentWorkspace() {
  const current = await getCurrentWorkspace();
  if (!current?.workspace?.id) throw new Error("You must be signed in with a workspace to manage agent settings.");
  return current;
}

async function requireCurrentWorkspaceId() {
  const current = await requireCurrentWorkspace();
  return current.workspace.id;
}

async function ensureBusinessProfile(workspaceId: string) {
  const current = await getCurrentWorkspace();
  const { db } = await import("@/lib/db");
  const existing = await (db as any).businessProfile.findUnique({ where: { workspaceId } });
  if (existing) return existing;

  const workspaceName = current?.workspace?.name || "Business Workspace";
  const contactEmail = current?.user?.email || current?.authUser?.email || "owner@example.com";

  return (db as any).businessProfile.create({
    data: {
      workspaceId,
      name: workspaceName,
      niche: "Service business",
      contactEmail,
      workingHours: "Not configured yet",
      servicesStyle: "Answer using the saved service catalogue.",
      pricingStyle: "Use saved prices only. If pricing is missing, say the team will confirm.",
      targetCustomer: "Prospects who want to ask questions and book an appointment.",
    },
  });
}

export async function saveAgentConfig(data: { name: string; tone: string; bookingLink?: string; customInstructions?: string; fallbackMessage?: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  const id = await requireCurrentWorkspaceId();
  await ensureBusinessProfile(id);
  await (db as any).agentConfig.upsert({ where: { workspaceId: id }, update: data, create: { workspaceId: id, ...data } });
  revalidatePath("/agent");
  return { success: true };
}

export async function saveService(data: { name: string; price: string; description: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const id = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const profile = await ensureBusinessProfile(id);
  const service = await (db as any).service.create({ data: { businessProfileId: profile.id, ...data } });
  revalidatePath("/agent");
  return { success: true, service };
}

export async function deleteService(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  await (db as any).service.delete({ where: { id } });
  revalidatePath("/agent");
  return { success: true };
}

export async function saveFAQ(data: { question: string; answer: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const id = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const profile = await ensureBusinessProfile(id);
  const faq = await (db as any).fAQ.create({ data: { businessProfileId: profile.id, ...data } });
  revalidatePath("/agent");
  return { success: true, faq };
}

export async function deleteFAQ(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  await (db as any).fAQ.delete({ where: { id } });
  revalidatePath("/agent");
  return { success: true };
}


export async function saveFunnelOptionPage(data: { title: string; subtitle?: string; intent: "ENQUIRY" | "BOOKING" | "BOTH" }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const workspaceId = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const pageCount = await (db as any).funnelOptionPage.count({ where: { workspaceId } });
  const page = await (db as any).funnelOptionPage.create({
    data: {
      workspaceId,
      title: data.title,
      subtitle: data.subtitle || null,
      intent: data.intent || "BOTH",
      sortOrder: pageCount,
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  revalidatePath("/agent");
  return { success: true, page };
}

export async function deleteFunnelOptionPage(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  await (db as any).funnelOptionPage.delete({ where: { id } });
  revalidatePath("/agent");
  return { success: true };
}

export async function saveFunnelOption(data: { pageId: string; title: string; answer: string; serviceName?: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  const optionCount = await (db as any).funnelOption.count({ where: { pageId: data.pageId } });
  const option = await (db as any).funnelOption.create({
    data: {
      pageId: data.pageId,
      title: data.title,
      answer: data.answer,
      serviceName: data.serviceName || null,
      sortOrder: optionCount,
    },
  });
  revalidatePath("/agent");
  return { success: true, option };
}

export async function deleteFunnelOption(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  await (db as any).funnelOption.delete({ where: { id } });
  revalidatePath("/agent");
  return { success: true };
}

export async function getAgentData() {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const { db } = await import("@/lib/db");
  const id = await requireCurrentWorkspaceId();
  const agentConfig = await (db as any).agentConfig.findUnique({ where: { workspaceId: id } });
  let businessProfile = await (db as any).businessProfile.findUnique({ where: { workspaceId: id }, include: { services: true, faqs: true } });
  if (!businessProfile) {
    await ensureBusinessProfile(id);
    businessProfile = await (db as any).businessProfile.findUnique({ where: { workspaceId: id }, include: { services: true, faqs: true } });
  }
  const funnelOptionPages = await (db as any).funnelOptionPage.findMany({
    where: { workspaceId: id, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  return { agentConfig, businessProfile, funnelOptionPages };
}
