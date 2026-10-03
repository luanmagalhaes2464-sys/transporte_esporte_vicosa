import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, permissionSet, requirePermission } from "@/security/authorization";
import { createTransportRequest } from "@/modules/school-transport/service";
import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";

const schema = z.object({
  periodId: z.string().uuid(),
  studentId: z.string().uuid(),
  accessibilityNeed: z.boolean().default(false),
  accessibilityInfo: z.string().max(500).optional(),
  observations: z.string().max(2000).optional()
});

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    const perms = permissionSet(user);
    if (perms.has("school_transport.request.review")) {
      return NextResponse.json(await prisma.schoolTransportRequest.findMany({
        include: { student: { include: { person: true } }, school: true, history: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 200
      }));
    }
    const guardian = await prisma.guardian.findFirst({ where: { personId: user.personId }, include: { students: true } });
    const studentIds = guardian?.students.map(s => s.studentId) ?? [];
    if (user.person.student) studentIds.push(user.person.student.id);
    return NextResponse.json(await prisma.schoolTransportRequest.findMany({
      where: { studentId: { in: studentIds } },
      include: { school: true, period: true, history: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" }
    }));
  } catch (e) { return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("school_transport.request.create");
    const v = schema.parse(await req.json());
    return NextResponse.json(await createTransportRequest({ ...v, actorUserId: user.id }), { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
