import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const createSchema = z.object({
  categoryId: z.string().uuid(), name: z.string().min(3).max(160), slug: z.string().min(3).max(180), imageUrl:z.string().url().optional(), description: z.string().min(10),
  audience: z.string().optional(), minAge: z.number().int().min(0).max(120).optional(), maxAge: z.number().int().min(0).max(120).optional(), classification:z.string().max(100).optional(),
  locationName: z.string().min(2), addressText: z.string().optional(), latitude:z.number().min(-90).max(90).optional(), longitude:z.number().min(-180).max(180).optional(), capacity: z.number().int().positive(),
  registrationStart: z.coerce.date(), registrationEnd: z.coerce.date(), activityStart: z.coerce.date(), activityEnd: z.coerce.date().optional(),
  rulesUrl:z.string().url().optional(), responsibleName:z.string().max(160).optional(), contact:z.string().max(180).optional(),
  offersTransport: z.boolean().default(false), transportCapacity: z.number().int().positive().optional(), status: z.enum(["DRAFT","SCHEDULED","OPEN","CLOSED","CANCELED","COMPLETED"]).default("DRAFT")
});

export async function GET(req: NextRequest) {
  const onlyOpen = req.nextUrl.searchParams.get("open") !== "false";
  const now = new Date();
  const rows = await prisma.sportsActivity.findMany({
    where: onlyOpen ? { active: true, status: "OPEN", registrationStart: { lte: now }, registrationEnd: { gte: now } } : { active: true },
    include: { category: true, _count: { select: { registrations: { where: { status: "CONFIRMED" } }, waitingList: { where: { status: { in: ["WAITING","CALLED"] } } } } } },
    orderBy: { registrationEnd: "asc" }
  });
  return NextResponse.json(rows.map(r => ({ ...r, availableSpots: Math.max(0, r.capacity - r._count.registrations) })));
}

export async function POST(req: NextRequest) {
  try {
    const user=await requirePermission("sports.activity.manage");
    const v = createSchema.parse(await req.json());
    if (v.registrationEnd <= v.registrationStart || (v.activityEnd && v.activityEnd < v.activityStart)) throw new Error("INVALID_PERIOD");
    if(v.minAge!=null&&v.maxAge!=null&&v.maxAge<v.minAge)throw new Error("INVALID_PERIOD");
    if(v.offersTransport&&v.transportCapacity&&v.transportCapacity>v.capacity)throw new Error("SPORTS_TRANSPORT_CAPACITY_INVALID");
    const row=await prisma.sportsActivity.create({ data: v });
    await audit({actorUserId:user.id,action:'CREATE',entityType:'sports_activity',entityId:row.id,changedFields:['name','categoryId','capacity','status','offersTransport'],after:{name:row.name,status:row.status,capacity:row.capacity,offersTransport:row.offersTransport}});
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
