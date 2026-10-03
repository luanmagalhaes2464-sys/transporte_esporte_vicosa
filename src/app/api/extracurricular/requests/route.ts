import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nextProtocol } from "@/lib/protocol";
import { currentUser, permissionSet, requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({ schoolId: z.string().uuid(), responsibleName: z.string().min(3), responsiblePhone: z.string().min(8), activity: z.string().min(3), purpose: z.enum(["PEDAGOGICAL_VISIT","SPORTS_COMPETITION","EVENT","FAIR","CULTURAL_ACTIVITY","TECHNICAL_VISIT","TOUR","OTHER"]), purposeOther: z.string().optional(), departureAt: z.coerce.date(), returnAt: z.coerce.date(), origin: z.string().min(2), destination: z.string().min(2), destinationAddress: z.string().optional(), destinationLatitude: z.number().min(-90).max(90).optional(), destinationLongitude: z.number().min(-180).max(180).optional(), studentCount: z.number().int().positive(), companionCount: z.number().int().min(0).default(0), ageRange: z.string().optional(), accessibilityNeed: z.boolean().default(false), observations: z.string().optional() });

export async function GET() {
  try {
    const user = await currentUser(); if (!user) throw new Error("UNAUTHORIZED");
    const perms = permissionSet(user);
    const canReview = perms.has("extracurricular.request.review");
    const schoolIds = user.schoolMemberships.map(m => m.schoolId);
    if (!canReview && !perms.has("extracurricular.request.create")) throw new Error("FORBIDDEN");
    return NextResponse.json(await prisma.extracurricularRequest.findMany({
      where: canReview ? undefined : { schoolId: { in: schoolIds } },
      include: { school: true, trips: { include: { vehicles: { where: { active: true }, include: { vehicle: true } }, drivers: { where: { active: true }, include: { driver: { include: { person: true } } } } } } },
      orderBy: { departureAt: "asc" }
    }));
  } catch (e) { return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("extracurricular.request.create");
    const v = schema.parse(await req.json());
    if (v.returnAt <= v.departureAt) throw new Error("INVALID_PERIOD");
    const perms = permissionSet(user);
    const canReviewAll = perms.has("extracurricular.request.review") || perms.has("admin.manage");
    if (!canReviewAll && !user.schoolMemberships.some(m => m.schoolId === v.schoolId)) throw new Error("SCHOOL_SCOPE_FORBIDDEN");
    const school = await prisma.school.findFirst({ where: { id: v.schoolId, active: true }, select: { id: true } });
    if (!school) throw new Error("SCHOOL_NOT_AVAILABLE");
    const row = await prisma.$transaction(async tx => {
      const protocol = await nextProtocol(tx, "EXT", v.departureAt.getFullYear());
      return tx.extracurricularRequest.create({ data: { ...v, protocol, createdById: user.id, history: { create: { toStatus: "REQUESTED", changedBy: user.id } } } });
    });
    await audit({ actorUserId: user.id, action: "CREATE", entityType: "extracurricular_request", entityId: row.id, after: { protocol: row.protocol, status: row.status } });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
