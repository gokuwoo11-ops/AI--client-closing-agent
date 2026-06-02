"use server";

import { revalidatePath } from "next/cache";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

async function requireCurrentWorkspace() {
  const current = await getCurrentWorkspace();
  if (!current?.workspace?.id) throw new Error("You must be signed in with a workspace to save onboarding.");
  return current;
}

async function requireCurrentWorkspaceId() {
  const current = await requireCurrentWorkspace();
  return current.workspace.id;
}

export async function saveBusinessProfile(formData: FormData) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const current = await requireCurrentWorkspace();
  const id = current.workspace.id;
  const name = String(formData.get("businessName") || "").trim();
  const niche = String(formData.get("niche") || "").trim();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || current.user?.email || current.authUser?.email || "").trim();
  if (!name || !niche) throw new Error("Business name and niche are required.");
  const { db } = await import("@/lib/db");
  await (db as any).businessProfile.upsert({ where: { workspaceId: id }, update: { name, niche, websiteUrl, location, contactEmail }, create: { workspaceId: id, name, niche, websiteUrl, location, contactEmail } });
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true };
}

export async function saveBusinessServices(data: { name: string; price: string; description: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const id = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const profile = await (db as any).businessProfile.findUnique({ where: { workspaceId: id } });
  if (!profile) throw new Error("Business profile must be created before adding services.");
  await (db as any).service.create({ data: { businessProfileId: profile.id, name: data.name, price: data.price, description: data.description } });
  revalidatePath("/onboarding");
  return { success: true };
}

export async function saveBusinessFAQ(data: { question: string; answer: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const id = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const profile = await (db as any).businessProfile.findUnique({ where: { workspaceId: id } });
  if (!profile) throw new Error("Business profile must be created before adding FAQs.");
  await (db as any).fAQ.create({ data: { businessProfileId: profile.id, question: data.question, answer: data.answer } });
  revalidatePath("/onboarding");
  return { success: true };
}

export async function saveAgentConfigOnboarding(data: { name: string; tone: string; customInstructions?: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const id = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  await (db as any).agentConfig.upsert({ where: { workspaceId: id }, update: data, create: { workspaceId: id, ...data } });
  revalidatePath("/dashboard");
  revalidatePath("/agent");
  return { success: true };
}
