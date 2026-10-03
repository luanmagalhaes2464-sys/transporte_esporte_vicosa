import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { requirePermission } from "@/security/authorization";
import { handleRouteError } from "@/lib/http";
import { audit } from "@/modules/audit/service";

const schema = z.object({ name: z.string().trim().min(2).max(180).optional(), popularName: z.string().trim().max(180).nullable().optional(), region: z.string().trim().max(180).nullable().optional(), districtId: z.string().uuid().nullable().optional(), active: z.boolean().optional(), latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("territory.manage"); const { id } = await ctx.params; const current = await prisma.ruralLocality.findUniqueOrThrow({ where: { id } }); const v = schema.parse(await req.json());
    if (v.districtId && !(await prisma.district.findFirst({ where: { id: v.districtId, municipalityId: current.municipalityId, active: true }, select: { id: true } }))) throw new Error("TERRITORY_REFERENCE_INVALID");
    const updated = await prisma.ruralLocality.update({ where: { id }, data: { ...v, ...(v.name ? { normalizedName: normalizeText(v.name) } : {}) } });
    await audit({ actorUserId: user.id, action: "UPDATE", entityType: "rural_locality", entityId: id, changedFields: Object.keys(v), before: { name: current.name, active: current.active }, after: { name: updated.name, active: updated.active } });
    return NextResponse.json(updated);
  } catch (e) { return handleRouteError(e); }
}
