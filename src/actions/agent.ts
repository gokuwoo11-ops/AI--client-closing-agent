"use server";

import { revalidatePath } from "next/cache";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

async function requireCurrentWorkspace() {
  const current = await getCurrentWorkspace();

  if (!current?.workspace?.id) {
    throw new Error(
      "You must be signed in with a workspace to manage agent settings.",
    );
  }

  return current;
}

async function requireCurrentWorkspaceId() {
  const current = await requireCurrentWorkspace();
  return current.workspace.id;
}

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

async function ensureBusinessProfile(workspaceId: string) {
  const current = await getCurrentWorkspace();
  const { db } = await import("@/lib/db");

  const existing = await (db as any).businessProfile.findUnique({
    where: { workspaceId },
  });

  if (existing) return existing;

  const workspaceName = current?.workspace?.name || "Business Workspace";
  const contactEmail =
    current?.user?.email || current?.authUser?.email || "owner@example.com";

  return (db as any).businessProfile.create({
    data: {
      workspaceId,
      name: workspaceName,
      niche: "Service business",
      contactEmail,
      workingHours: "Not configured yet",
      servicesStyle: "Answer using the saved service catalogue.",
      pricingStyle:
        "Use saved prices only. If pricing is missing, say the team will confirm.",
      targetCustomer:
        "Prospects who want to ask questions and book an appointment.",
    },
  });
}

async function assertServiceBelongsToWorkspace(
  serviceId: string,
  workspaceId: string,
) {
  const { db } = await import("@/lib/db");

  const service = await (db as any).service.findFirst({
    where: {
      id: serviceId,
      businessProfile: { workspaceId },
    },
    select: { id: true },
  });

  if (!service) {
    throw new Error("Service not found in your workspace.");
  }
}

async function assertFAQBelongsToWorkspace(faqId: string, workspaceId: string) {
  const { db } = await import("@/lib/db");

  const faq = await (db as any).fAQ.findFirst({
    where: {
      id: faqId,
      businessProfile: { workspaceId },
    },
    select: { id: true },
  });

  if (!faq) {
    throw new Error("FAQ not found in your workspace.");
  }
}

async function assertPageBelongsToWorkspace(
  pageId: string,
  workspaceId: string,
) {
  const { db } = await import("@/lib/db");

  const page = await (db as any).funnelOptionPage.findFirst({
    where: {
      id: pageId,
      workspaceId,
    },
    select: { id: true },
  });

  if (!page) {
    throw new Error("Funnel page not found in your workspace.");
  }
}

async function assertOptionBelongsToWorkspace(
  optionId: string,
  workspaceId: string,
) {
  const { db } = await import("@/lib/db");

  const option = await (db as any).funnelOption.findFirst({
    where: {
      id: optionId,
      page: { workspaceId },
    },
    select: { id: true },
  });

  if (!option) {
    throw new Error("Funnel option not found in your workspace.");
  }
}

export async function saveAgentConfig(data: {
  name: string;
  tone: string;
  bookingLink?: string;
  customInstructions?: string;
  fallbackMessage?: string;
}) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const { db } = await import("@/lib/db");
  const workspaceId = await requireCurrentWorkspaceId();

  await ensureBusinessProfile(workspaceId);

  const safeData = {
    name: cleanText(data.name, "Booking Assistant").slice(0, 80),
    tone: cleanText(data.tone, "professional").slice(0, 60),
    bookingLink: cleanText(data.bookingLink).slice(0, 500) || null,
    customInstructions:
      cleanText(data.customInstructions).slice(0, 4000) || null,
    fallbackMessage: cleanText(
      data.fallbackMessage,
      "The team will confirm the best details for you.",
    ).slice(0, 600),
  };

  await (db as any).agentConfig.upsert({
    where: { workspaceId },
    update: safeData,
    create: {
      workspaceId,
      ...safeData,
    },
  });

  revalidatePath("/agent");

  return { success: true };
}

export async function saveService(data: {
  name: string;
  price: string;
  description: string;
}) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const profile = await ensureBusinessProfile(workspaceId);

  const service = await (db as any).service.create({
    data: {
      businessProfileId: profile.id,
      name: cleanText(data.name, "Service").slice(0, 120),
      price: cleanText(data.price).slice(0, 80) || null,
      description: cleanText(data.description).slice(0, 1000),
    },
  });

  revalidatePath("/agent");

  return { success: true, service };
}

export async function deleteService(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();

  await assertServiceBelongsToWorkspace(id, workspaceId);

  const { db } = await import("@/lib/db");

  await (db as any).service.delete({
    where: { id },
  });

  revalidatePath("/agent");

  return { success: true };
}

export async function saveFAQ(data: { question: string; answer: string }) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");
  const profile = await ensureBusinessProfile(workspaceId);

  const faq = await (db as any).fAQ.create({
    data: {
      businessProfileId: profile.id,
      question: cleanText(data.question).slice(0, 500),
      answer: cleanText(data.answer).slice(0, 1600),
    },
  });

  revalidatePath("/agent");

  return { success: true, faq };
}

export async function deleteFAQ(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();

  await assertFAQBelongsToWorkspace(id, workspaceId);

  const { db } = await import("@/lib/db");

  await (db as any).fAQ.delete({
    where: { id },
  });

  revalidatePath("/agent");

  return { success: true };
}

export async function saveFunnelOptionPage(data: {
  title: string;
  subtitle?: string;
  intent: "ENQUIRY" | "BOOKING" | "BOTH";
}) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();
  const { db } = await import("@/lib/db");

  const pageCount = await (db as any).funnelOptionPage.count({
    where: { workspaceId },
  });

  const page = await (db as any).funnelOptionPage.create({
    data: {
      workspaceId,
      title: cleanText(data.title).slice(0, 160),
      subtitle: cleanText(data.subtitle).slice(0, 300) || null,
      intent: data.intent || "BOTH",
      sortOrder: pageCount,
    },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  revalidatePath("/agent");

  return { success: true, page };
}

export async function deleteFunnelOptionPage(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();

  await assertPageBelongsToWorkspace(id, workspaceId);

  const { db } = await import("@/lib/db");

  await (db as any).funnelOptionPage.delete({
    where: { id },
  });

  revalidatePath("/agent");

  return { success: true };
}

export async function saveFunnelOption(data: {
  id?: string;
  pageId: string;
  title: string;
  answer: string;
  serviceName?: string;
  parentOptionId?: string | null;
  nextPageId?: string | null;
  finalAction?: "GO_TO_NEXT_PAGE" | "ASK_REQUIREMENT" | "SHOW_SLOTS";
}) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();

  await assertPageBelongsToWorkspace(data.pageId, workspaceId);

  if (data.id) {
    await assertOptionBelongsToWorkspace(data.id, workspaceId);
  }

  if (data.nextPageId) {
    await assertPageBelongsToWorkspace(data.nextPageId, workspaceId);
  }

  if (data.parentOptionId) {
    await assertOptionBelongsToWorkspace(data.parentOptionId, workspaceId);
  }

  if (data.id && data.parentOptionId === data.id) {
    throw new Error("An option cannot be placed after itself.");
  }

  const { db } = await import("@/lib/db");

  const safeData = {
    pageId: data.pageId,
    title: cleanText(data.title).slice(0, 160),
    answer: cleanText(data.answer).slice(0, 2000),
    serviceName: cleanText(data.serviceName).slice(0, 160) || null,
    parentOptionId: data.parentOptionId || null,
    nextPageId: data.nextPageId || null,
    finalAction:
      data.finalAction ||
      (data.nextPageId ? "GO_TO_NEXT_PAGE" : "ASK_REQUIREMENT"),
  };

  if (data.id) {
    const option = await (db as any).funnelOption.update({
      where: { id: data.id },
      data: safeData,
    });

    revalidatePath("/agent");

    return { success: true, option };
  }

  const optionCount = await (db as any).funnelOption.count({
    where: { pageId: data.pageId },
  });

  const option = await (db as any).funnelOption.create({
    data: {
      ...safeData,
      sortOrder: optionCount,
    },
  });

  revalidatePath("/agent");

  return { success: true, option };
}

export async function deleteFunnelOption(id: string) {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const workspaceId = await requireCurrentWorkspaceId();

  await assertOptionBelongsToWorkspace(id, workspaceId);

  const { db } = await import("@/lib/db");

  await (db as any).funnelOption.delete({
    where: { id },
  });

  revalidatePath("/agent");

  return { success: true };
}

export async function getAgentData() {
  if (!hasDatabase()) throw new Error("Database is not configured.");

  const { db } = await import("@/lib/db");
  const workspaceId = await requireCurrentWorkspaceId();

  const agentConfig = await (db as any).agentConfig.findUnique({
    where: { workspaceId },
  });

  let businessProfile = await (db as any).businessProfile.findUnique({
    where: { workspaceId },
    include: {
      services: true,
      faqs: true,
    },
  });

  if (!businessProfile) {
    await ensureBusinessProfile(workspaceId);

    businessProfile = await (db as any).businessProfile.findUnique({
      where: { workspaceId },
      include: {
        services: true,
        faqs: true,
      },
    });
  }

  const funnelOptionPages = await (db as any).funnelOptionPage.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
    include: {
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return {
    agentConfig,
    businessProfile,
    funnelOptionPages,
  };
}
