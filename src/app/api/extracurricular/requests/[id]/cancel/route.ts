import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, permissionSet } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    const perms = permissionSet(user);
    if (!perms.has("extracurricular.request.create")) throw new Error("FORBIDDEN");

    const { id } = await ctx.params;
    const row = await prisma.extracurricularRequest.findUniqueOrThrow({ where: { id } });
    const canReviewAll = perms.has("extracurricular.request.review") || perms.has("admin.manage");
    if (!canReviewAll && !user.schoolMemberships.some(m => m.schoolId === row.schoolId)) throw new Error("SCHOOL_SCOPE_FORBIDDEN");
    if (["COMPLETED","DENIED","CANCELED"].includes(row.status)) throw new Error("INVALID_STATUS_TRANSITION");

    const hours = (row.departureAt.getTime() - Date.now()) / 3_600_000;
    if (!canReviewAll && hours < 48) throw new Error("EXTRA_REQUEST_CANCELLATION_NOTICE");

    const updated = await prisma.$transaction(async tx => {
      const result = await tx.extracurricularRequest.update({ where: { id }, data: { status: "CANCELED" } });
      await tx.extraRequestHistory.create({ data: { requestId: id, fromStatus: row.status, toStatus: "CANCELED", note: "Cancelamento solicitado pela escola.", changedBy: user.id } });
      await tx.trip.updateMany({ where: { extraRequestId: id, status: { notIn: ["COMPLETED","CANCELED"] } }, data: { status: "CANCELED" } });
      return result;
    });
    await audit({ actorUserId: user.id, action: "STATUS_CHANGE", entityType: "extracurricular_request", entityId: id, changedFields: ["status"], before: { status: row.status }, after: { status: "CANCELED" } });
    return NextResponse.json(updated);
  } catch (e) { return handleRouteError(e); }
}
