import { PrismaClient } from "@prisma/client";

declare global { var prismaGlobal: PrismaClient | undefined; }

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({
  log: process.env.APP_ENV === "development" ? ["warn", "error"] : ["error"]
});

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
