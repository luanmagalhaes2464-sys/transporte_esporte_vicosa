import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SENSITIVE = new Set(["password", "passwordHash", "cpf", "token", "document", "latitude", "longitude"]);
function clean(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object") return value as Prisma.InputJsonValue;
  if (Array.isArray(value)) return value.map(v => clean(v) ?? null) as Prisma.InputJsonValue;
  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE.has(k)) continue;
    const cv = clean(v); if (cv !== undefined) out[k] = cv;
  }
  return out;
}

export async function audit(input: {
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  changedFields?: string[];
  before?: unknown;
  after?: unknown;
}) {
  return prisma.auditLog.create({ data: {
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    changedFields: input.changedFields ?? [],
    before: clean(input.before),
    after: clean(input.after)
  }});
}
