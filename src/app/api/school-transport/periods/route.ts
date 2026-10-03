import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({
  name: z.string().min(3),
  academicYear: z.number().int().min(2020).max(2100),
  requestStart: z.coerce.date(),
  requestEnd: z.coerce.date(),
  rules: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "OPEN", "CLOSED"]).default("DRAFT"),
  schoolIds: z.array(z.string().uuid()).max(500).default([]),
  documentRequirements: z.array(z.object({ name: z.string().min(2).max(120), required: z.boolean().default(true) })).max(30).default([])
});

export async function GET() {
  return NextResponse.json(await prisma.schoolTransportPeriod.findMany({
    include: { schools: { include: { school: true } }, documentRequirements: { where: { active: true } } },
    orderBy: { academicYear: "desc" }
  }));
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("school_transport.period.manage");
    const v = schema.parse(await req.json());
    if (v.requestEnd <= v.requestStart) throw new Error("INVALID_PERIOD");
    const schools = v.schoolIds.length ? await prisma.school.count({ where: { id: { in: v.schoolIds }, active: true } }) : 0;
    if (schools !== new Set(v.schoolIds).size) throw new Error("SCHOOL_NOT_AVAILABLE");
    const row = await prisma.schoolTransportPeriod.create({
      data: {
        name: v.name, academicYear: v.academicYear, requestStart: v.requestStart, requestEnd: v.requestEnd, rules: v.rules, status: v.status,
        schools: v.schoolIds.length ? { create: [...new Set(v.schoolIds)].map(schoolId => ({ schoolId })) } : undefined,
        documentRequirements: v.documentRequirements.length ? { create: v.documentRequirements } : undefined
      },
      include: { schools: true, documentRequirements: true }
    });
    await audit({ actorUserId: user.id, action: "CREATE", entityType: "school_transport_period", entityId: row.id, changedFields: ["status", "schools", "documentRequirements"], after: { status: row.status } });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
