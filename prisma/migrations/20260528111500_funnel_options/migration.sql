-- Owner-configurable option pages for the public enquiry/booking funnel
CREATE TYPE "FunnelOptionIntent" AS ENUM ('ENQUIRY', 'BOOKING', 'BOTH');

CREATE TABLE "FunnelOptionPage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "intent" "FunnelOptionIntent" NOT NULL DEFAULT 'BOTH',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FunnelOptionPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FunnelOption" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "serviceName" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FunnelOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FunnelOptionPage_workspaceId_intent_isActive_idx" ON "FunnelOptionPage"("workspaceId", "intent", "isActive");
CREATE INDEX "FunnelOption_pageId_isActive_sortOrder_idx" ON "FunnelOption"("pageId", "isActive", "sortOrder");

ALTER TABLE "FunnelOptionPage" ADD CONSTRAINT "FunnelOptionPage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FunnelOption" ADD CONSTRAINT "FunnelOption_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "FunnelOptionPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
