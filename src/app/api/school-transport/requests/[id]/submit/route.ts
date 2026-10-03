import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/security/authorization";
import { ownsTransportRequest } from "@/security/ownership";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser(); if (!user) throw new Error("UNAUTHORIZED");
    const { id } = await context.params;
    if (!(await ownsTransportRequest(user, id))) throw new Error("FORBIDDEN");
    const request = await prisma.schoolTransportRequest.findUniqueOrThrow({
      where: { id },
      include: { period: { include: { documentRequirements: { where: { active: true, required: true } } } }, documents: true }
    });
    if (request.status !== "DRAFT") throw new Error("INVALID_STATUS_TRANSITION");
    const attachedRequirementIds = new Set(request.documents.map(d => d.transportRequirementId).filter(Boolean));
    const missing = request.period.documentRequirements.filter(r => !attachedRequirementIds.has(r.id));
    if (missing.length) throw new Error("REQUIRED_DOCUMENTS_MISSING");
    const row = await prisma.$transaction(async tx => {
      const updated = await tx.schoolTransportRequest.update({ where: { id }, data: { status: "SUBMITTED", submittedAt: new Date() } });
      await tx.transportRequestHistory.create({ data: { requestId: id, fromStatus: "DRAFT", toStatus: "SUBMITTED", changedBy: user.id } });
      return updated;
    });
    await audit({ actorUserId: user.id, action: "STATUS_CHANGE", entityType: "school_transport_request", entityId: id, changedFields: ["status"], before: { status: "DRAFT" }, after: { status: "SUBMITTED" } });
    return NextResponse.json(row);
  } catch (e) { return handleRouteError(e); }
}
