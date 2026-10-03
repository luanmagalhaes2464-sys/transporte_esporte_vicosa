import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser, permissionSet } from "@/security/authorization";
import { ownsExtracurricularRequest, ownsSportsRegistration, ownsTransportRequest } from "@/security/ownership";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({
  ownerType: z.enum(["SCHOOL_TRANSPORT_REQUEST","EXTRA_REQUEST","SPORTS_REGISTRATION","USER","OTHER"]),
  storageKey: z.string().min(10).max(500), originalFilename: z.string().min(1).max(200), mimeType: z.enum(["application/pdf","image/jpeg","image/png"]), sizeBytes: z.number().int().positive().max(10_000_000), sha256: z.string().length(64).optional(),
  transportRequestId: z.string().uuid().nullable().optional(), transportRequirementId: z.string().uuid().nullable().optional(), extraRequestId: z.string().uuid().nullable().optional(), sportsRegistrationId: z.string().uuid().nullable().optional()
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser(); if (!user) throw new Error("UNAUTHORIZED");
    const v = schema.parse(await req.json());
    if (!v.storageKey.startsWith(`documents/${user.id}/`)) throw new Error("FORBIDDEN");
    const perms = permissionSet(user);

    if (v.ownerType === "SCHOOL_TRANSPORT_REQUEST") {
      if (!v.transportRequestId || !v.transportRequirementId || !(await ownsTransportRequest(user, v.transportRequestId))) throw new Error("FORBIDDEN");
      const request = await prisma.schoolTransportRequest.findUniqueOrThrow({ where: { id: v.transportRequestId }, select: { periodId: true, status: true } });
      if (request.status !== "DRAFT") throw new Error("DOCUMENT_UPLOAD_CLOSED");
      const requirement = await prisma.transportDocumentRequirement.findFirst({ where: { id: v.transportRequirementId, periodId: request.periodId, active: true }, select: { id: true } });
      if (!requirement) throw new Error("DOCUMENT_REQUIREMENT_INVALID");
    } else if (v.ownerType === "EXTRA_REQUEST") {
      if (!v.extraRequestId || !(await ownsExtracurricularRequest(user, v.extraRequestId))) throw new Error("FORBIDDEN");
    } else if (v.ownerType === "SPORTS_REGISTRATION") {
      if (!v.sportsRegistrationId || !(await ownsSportsRegistration(user, v.sportsRegistrationId))) throw new Error("FORBIDDEN");
    } else if (v.ownerType === "OTHER" && !perms.has("admin.manage")) {
      throw new Error("FORBIDDEN");
    }

    const row = v.transportRequestId && v.transportRequirementId
      ? await prisma.document.upsert({
          where: { transportRequestId_transportRequirementId: { transportRequestId: v.transportRequestId, transportRequirementId: v.transportRequirementId } },
          update: { storageKey: v.storageKey, originalFilename: v.originalFilename, mimeType: v.mimeType, sizeBytes: v.sizeBytes, sha256: v.sha256, createdById: user.id },
          create: { ...v, createdById: user.id }
        })
      : await prisma.document.create({ data: { ...v, createdById: user.id } });
    await audit({ actorUserId: user.id, action: "CREATE", entityType: "document", entityId: row.id, changedFields: ["ownerType"] });
    return NextResponse.json({ id: row.id, filename: row.originalFilename }, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
