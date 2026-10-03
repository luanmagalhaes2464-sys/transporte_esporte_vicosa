import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({ fullName: z.string().min(3), phone: z.string().min(8), cnh: z.string().min(5), category: z.string().min(1), cnhExpiry: z.coerce.date(), userEmail: z.string().email().optional().or(z.literal("")) });

export async function GET() {
  try { await requirePermission("fleet.trip.read"); return NextResponse.json(await prisma.driver.findMany({ where: { active: true }, include: { person: { include: { user: true } } }, orderBy: { person: { fullName: "asc" } } })); }
  catch (e) { return handleRouteError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("fleet.driver.manage"); const v = schema.parse(await req.json());
    const row = await prisma.$transaction(async tx => {
      let personId: string;
      let linkedUserId: string | null = null;
      if (v.userEmail) {
        const user = await tx.user.findUnique({ where: { email: v.userEmail.toLowerCase() }, include: { person: { include: { driver: true } } } });
        if (!user) throw new Error("DRIVER_USER_NOT_FOUND");
        if (user.person.driver) throw new Error("DRIVER_ALREADY_LINKED");
        personId = user.personId; linkedUserId = user.id;
        await tx.person.update({ where: { id: personId }, data: { fullName: v.fullName, phone: v.phone } });
      } else {
        const p = await tx.person.create({ data: { fullName: v.fullName, phone: v.phone } }); personId = p.id;
      }
      const driver = await tx.driver.create({ data: { personId, cnh: v.cnh, category: v.category, cnhExpiry: v.cnhExpiry } });
      if (linkedUserId) {
        const role = await tx.role.findUniqueOrThrow({ where: { code: "DRIVER" } });
        await tx.userRole.upsert({ where: { userId_roleId: { userId: linkedUserId, roleId: role.id } }, update: {}, create: { userId: linkedUserId, roleId: role.id } });
      }
      return driver;
    });
    await audit({ actorUserId: actor.id, action: "CREATE", entityType: "driver", entityId: row.id, changedFields: ["category", "cnhExpiry"] });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return handleRouteError(e); }
}
