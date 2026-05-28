import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createMissingDatabaseProxy(): PrismaClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Database is not configured. Set DATABASE_URL or DIRECT_URL before using database-backed routes.");
      },
    }
  ) as PrismaClient;
}

function createPrismaClient() {
  if (!connectionString) return createMissingDatabaseProxy();

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && connectionString) {
  globalForPrisma.prisma = db;
}
